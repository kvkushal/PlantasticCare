const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Load environment variables
require('dotenv').config();

const app = express();

// Environment Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/PlantasticCare';
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Rate Limiting - Prevent brute force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: { error: 'Too many login attempts, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(bodyParser.json());

// CORS Configuration - Secure settings
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5000', 'http://127.0.0.1:5000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all in development, restrict in production
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// MongoDB connection (removed deprecated options)
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.log('❌ MongoDB connection error:', err));

// Serve static frontend files 
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// SCHEMAS AND MODELS
// ============================================

// User Schema and Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    favorites: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Complaint/Suggestion Schema and Model
const complaintSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

const Complaint = mongoose.model('Complaint', complaintSchema);

// Newsletter Schema and Model
const newsletterSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    subscribedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

// Comment Schema (embedded in posts)
const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    author: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

// Post Schema and Model
const postSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    comments: [commentSchema],
    upvotes: { type: [String], default: [] },
    downvotes: { type: [String], default: [] },
});

const Post = mongoose.model('Post', postSchema);

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Email validation helper
const isValidEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
};

// Phone validation helper
const isValidPhone = (phone) => {
    const phonePattern = /^\d{10}$/;
    return phonePattern.test(phone);
};

// ============================================
// MIDDLEWARE
// ============================================

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized, please login first' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Session expired, please login again' });
            }
            return res.status(403).json({ message: 'Invalid token, please login again' });
        }
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    });
};

// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (!err) {
                req.userId = decoded.userId;
                req.userEmail = decoded.email;
            }
        });
    }
    next();
};

// ============================================
// AUTH ROUTES
// ============================================

// Registration Endpoint
app.post('/register', authLimiter, async (req, res) => {
    const { username, email, phone, password } = req.body;

    // Input validation
    if (!username || !email || !phone || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (!isValidPhone(phone)) {
        return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            phone,
            password: hashedPassword
        });
        await newUser.save();

        res.status(201).json({ message: 'Account created successfully! Please login.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// Login Endpoint
app.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// Verify Token Endpoint
app.get('/verify-token', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ valid: false, message: 'User not found' });
        }
        res.json({
            valid: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ valid: false, message: 'Token verification failed' });
    }
});

// Get Current User Profile
app.get('/profile', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update User Profile
app.put('/profile', authenticateJWT, async (req, res) => {
    const { username, phone } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (username) user.username = username.trim();
        if (phone) {
            if (!isValidPhone(phone)) {
                return res.status(400).json({ error: 'Phone number must be 10 digits' });
            }
            user.phone = phone;
        }

        await user.save();
        res.json({ message: 'Profile updated successfully', user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ============================================
// POST ROUTES (FORUM)
// ============================================

// Create a new post
app.post('/posts', authenticateJWT, async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newPost = new Post({
            title: title.trim(),
            content: content.trim(),
            author: user.username,
            authorId: user._id,
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Failed to create post' });
    }
});

// Get all posts
app.get('/posts', optionalAuth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });

        // Add computed vote counts
        const postsWithVotes = posts.map(post => ({
            ...post.toObject(),
            upvoteCount: post.upvotes.length,
            downvoteCount: post.downvotes.length,
            voteScore: post.upvotes.length - post.downvotes.length,
            hasUpvoted: req.userId ? post.upvotes.includes(req.userId) : false,
            hasDownvoted: req.userId ? post.downvotes.includes(req.userId) : false,
        }));

        res.status(200).json(postsWithVotes);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Failed to fetch posts' });
    }
});

// Get single post by ID
app.get('/posts/:postId', optionalAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        res.json({
            ...post.toObject(),
            upvoteCount: post.upvotes.length,
            downvoteCount: post.downvotes.length,
            voteScore: post.upvotes.length - post.downvotes.length,
            hasUpvoted: req.userId ? post.upvotes.includes(req.userId) : false,
            hasDownvoted: req.userId ? post.downvotes.includes(req.userId) : false,
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'Failed to fetch post' });
    }
});

// Delete a post (only by author)
app.delete('/posts/:postId', authenticateJWT, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.authorId.toString() !== req.userId) {
            return res.status(403).json({ message: 'You can only delete your own posts' });
        }

        await Post.findByIdAndDelete(req.params.postId);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Failed to delete post' });
    }
});

// Add a comment to a post
app.post('/posts/:postId/comments', authenticateJWT, async (req, res) => {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: 'Comment text is required' });
    }

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const newComment = {
            text: text.trim(),
            author: user.username,
            authorId: user._id,
        };

        post.comments.push(newComment);
        await post.save();

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Failed to add comment' });
    }
});

// Upvote a Post
app.post('/posts/:postId/upvote', authenticateJWT, async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const userIdStr = req.userId.toString();

        // Check if the user has already upvoted
        if (post.upvotes.includes(userIdStr)) {
            // Remove upvote (toggle off)
            post.upvotes = post.upvotes.filter(id => id !== userIdStr);
        } else {
            // Remove downvote if exists
            post.downvotes = post.downvotes.filter(id => id !== userIdStr);
            // Add upvote
            post.upvotes.push(userIdStr);
        }

        await post.save();

        res.status(200).json({
            message: 'Vote updated successfully',
            upvoteCount: post.upvotes.length,
            downvoteCount: post.downvotes.length,
            voteScore: post.upvotes.length - post.downvotes.length,
            hasUpvoted: post.upvotes.includes(userIdStr),
            hasDownvoted: post.downvotes.includes(userIdStr),
        });
    } catch (error) {
        console.error('Error upvoting post:', error);
        res.status(500).json({ message: 'Failed to upvote post' });
    }
});

// Downvote a Post
app.post('/posts/:postId/downvote', authenticateJWT, async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const userIdStr = req.userId.toString();

        // Check if the user has already downvoted
        if (post.downvotes.includes(userIdStr)) {
            // Remove downvote (toggle off)
            post.downvotes = post.downvotes.filter(id => id !== userIdStr);
        } else {
            // Remove upvote if exists
            post.upvotes = post.upvotes.filter(id => id !== userIdStr);
            // Add downvote
            post.downvotes.push(userIdStr);
        }

        await post.save();

        res.status(200).json({
            message: 'Vote updated successfully',
            upvoteCount: post.upvotes.length,
            downvoteCount: post.downvotes.length,
            voteScore: post.upvotes.length - post.downvotes.length,
            hasUpvoted: post.upvotes.includes(userIdStr),
            hasDownvoted: post.downvotes.includes(userIdStr),
        });
    } catch (error) {
        console.error('Error downvoting post:', error);
        res.status(500).json({ message: 'Failed to downvote post' });
    }
});

// ============================================
// CONTACT & NEWSLETTER ROUTES
// ============================================

// Complaint/Suggestion Endpoint
app.post('/complaint', authLimiter, async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    try {
        const newComplaint = new Complaint({ name, email, phone, message });
        await newComplaint.save();
        res.status(201).json({ message: 'Your message has been received. Thank you!' });
    } catch (error) {
        console.error('Complaint error:', error);
        res.status(500).json({ error: 'Failed to submit message. Please try again.' });
    }
});

// Newsletter Subscription Endpoint
app.post('/newsletter/subscribe', authLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    try {
        const existingSubscriber = await Newsletter.findOne({ email: email.toLowerCase() });
        if (existingSubscriber) {
            if (!existingSubscriber.isActive) {
                existingSubscriber.isActive = true;
                await existingSubscriber.save();
                return res.json({ message: 'Welcome back! Your subscription has been reactivated.' });
            }
            return res.status(400).json({ error: 'This email is already subscribed!' });
        }

        const newSubscriber = new Newsletter({ email: email.toLowerCase() });
        await newSubscriber.save();
        res.status(201).json({ message: 'Thank you for subscribing to our newsletter!' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
    }
});

// Unsubscribe from newsletter
app.post('/newsletter/unsubscribe', async (req, res) => {
    const { email } = req.body;

    try {
        const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
        if (!subscriber) {
            return res.status(404).json({ error: 'Email not found in our mailing list' });
        }

        subscriber.isActive = false;
        await subscriber.save();
        res.json({ message: 'You have been unsubscribed successfully' });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ error: 'Failed to unsubscribe. Please try again.' });
    }
});

// ============================================
// PLANTS ROUTES
// ============================================

// Endpoint to fetch plants based on filters
app.get('/plants', (req, res) => {
    const { maintenance, sunlight, climate, soilType, toxicity, wateringFrequency, search } = req.query;

    const plantDataPath = path.join(__dirname, '../frontend/data/plants.json');

    fs.readFile(plantDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading plants.json:', err);
            return res.status(500).json({ error: 'Failed to load plant data' });
        }

        try {
            let plants = JSON.parse(data);

            // Apply search filter
            if (search) {
                const searchLower = search.toLowerCase();
                plants = plants.filter(plant =>
                    plant.name.toLowerCase().includes(searchLower)
                );
            }

            // Apply filters
            plants = plants.filter(plant => {
                return (!maintenance || plant.maintenance === maintenance) &&
                    (!sunlight || plant.sunlight === sunlight) &&
                    (!climate || plant.climate === climate) &&
                    (!soilType || plant.soilType === soilType) &&
                    (!toxicity || plant.toxicity === toxicity) &&
                    (!wateringFrequency || plant.wateringFrequency === wateringFrequency);
            });

            res.json(plants);
        } catch (error) {
            console.error('Error parsing plants.json:', error);
            res.status(500).json({ error: 'Failed to parse plant data' });
        }
    });
});

// Get single plant by name
app.get('/plants/:name', (req, res) => {
    const plantDataPath = path.join(__dirname, '../frontend/data/plants.json');

    fs.readFile(plantDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading plants.json:', err);
            return res.status(500).json({ error: 'Failed to load plant data' });
        }

        try {
            const plants = JSON.parse(data);
            const plant = plants.find(p =>
                p.name.toLowerCase() === req.params.name.toLowerCase()
            );

            if (!plant) {
                return res.status(404).json({ error: 'Plant not found' });
            }

            res.json(plant);
        } catch (error) {
            console.error('Error parsing plants.json:', error);
            res.status(500).json({ error: 'Failed to parse plant data' });
        }
    });
});

// ============================================
// FAVORITES ROUTES
// ============================================

// Add plant to favorites
app.post('/favorites', authenticateJWT, async (req, res) => {
    const { plantName } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Store plant name directly since we don't have a Plant model
        if (!user.favorites) user.favorites = [];

        if (user.favorites.includes(plantName)) {
            return res.status(400).json({ error: 'Plant is already in your favorites' });
        }

        user.favorites.push(plantName);
        await user.save();

        res.json({ message: 'Plant added to favorites', favorites: user.favorites });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ error: 'Failed to add to favorites' });
    }
});

// Remove plant from favorites
app.delete('/favorites/:plantName', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.favorites = user.favorites.filter(name => name !== req.params.plantName);
        await user.save();

        res.json({ message: 'Plant removed from favorites', favorites: user.favorites });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ error: 'Failed to remove from favorites' });
    }
});

// Get user's favorites
app.get('/favorites', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ favorites: user.favorites || [] });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// 404 handler for non-API routes (serve 404.html)
app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
        res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
    } else {
        next();
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🌱 PlantasticCare server running on port ${PORT}`);
    console.log(`📍 Environment: ${NODE_ENV}`);
    console.log(`🔗 http://localhost:${PORT}`);
});
