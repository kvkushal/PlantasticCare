const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/PlantasticCare', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Serve static frontend files 
app.use(express.static(path.join(__dirname, '../frontend')));

// User Schema and Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Complaint/Suggestion Schema and Model
const complaintSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
});

const Complaint = mongoose.model('Complaint', complaintSchema);

// Newsletter Schema and Model
const newsletterSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now },
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

// Post and Comment Schema and Models
const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    comments: [commentSchema],
    upvotes: { type: [String], default: [] },
    downvotes: { type: [String], default: [] },
});

const Post = mongoose.model('Post', postSchema);

// JWT Secret key
const JWT_SECRET = 'secret_key';

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized, please login first' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Please login first' });
        req.userId = decoded.userId;
        next();
    });
};

// Registration Endpoint
app.post('/register', async (req, res) => {
    const { username, email, phone, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, phone, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } 
    catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new post
app.post('/posts', authenticateJWT, async (req, res) => {
    const { title, content } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const newPost = new Post({
            title,
            content,
            author: user.username,
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: "Failed to create post" });
    }
});

// Get all posts
app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: "Failed to fetch posts" });
    }
});

// Add a comment to a post
app.post('/posts/:postId/comments', authenticateJWT, async (req, res) => {
    const { postId } = req.params;
    const { text } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const newComment = {
            text,
            author: user.username,
        };

        post.comments.push(newComment);
        await post.save();
        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: "Failed to add comment" });
    }
});

// Complaint/Suggestion Endpoint
app.post('/complaint', async (req, res) => {
    const { name, email, phone, message } = req.body;

    try {
        const newComplaint = new Complaint({ name, email, phone, message });
        await newComplaint.save();
        res.status(201).json({ message: 'Your response has been received. Thank you!' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Newsletter Subscription Endpoint
app.post('/newsletter/subscribe', async (req, res) => {
    const { email } = req.body;

    try {
        const existingSubscriber = await Newsletter.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).json({ error: 'Email already subscribed!' });
        }

        const newSubscriber = new Newsletter({ email });
        await newSubscriber.save();
        res.status(201).json({ message: 'Thank you for subscribing to our newsletter!' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'An error occurred while subscribing. Please try again.' });
    }
});

// Endpoint to fetch plants based on filters
app.get('/plants', (req, res) => {
    const { maintenance, sunlight, climate, soilType, toxicity, wateringFrequency } = req.query;

    // Path to plants.json file
    const plantDataPath = path.join(__dirname, '../frontend/data/plants.json');

    // Read the plants.json file
    fs.readFile(plantDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading plants.json:', err);
            return res.status(500).json({ error: 'Failed to load plant data' });
        }

        try {
            let plants = JSON.parse(data);

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

// Upvote a Post
app.post('/posts/:postId/upvote', authenticateJWT, async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Check if the user has already upvoted
        if (post.upvotes.includes(req.userId)) {
            return res.status(400).json({ message: 'You have already upvoted this post' });
        }

        // Remove downvote if the user had downvoted
        const downvoteIndex = post.downvotes.indexOf(req.userId);
        if (downvoteIndex > -1) {
            post.downvotes.splice(downvoteIndex, 1);
        }

        // Add the user to the upvotes
        post.upvotes.push(req.userId);

        await post.save();
        res.status(200).json({ message: 'Post upvoted successfully', post });
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

        // Check if the user has already downvoted
        if (post.downvotes.includes(req.userId)) {
            return res.status(400).json({ message: 'You have already downvoted this post' });
        }

        // Remove upvote if the user had upvoted
        const upvoteIndex = post.upvotes.indexOf(req.userId);
        if (upvoteIndex > -1) {
            post.upvotes.splice(upvoteIndex, 1);
        }

        // Add the user to the downvotes
        post.downvotes.push(req.userId);

        await post.save();
        res.status(200).json({ message: 'Post downvoted successfully', post });
    } catch (error) {
        console.error('Error downvoting post:', error);
        res.status(500).json({ message: 'Failed to downvote post' });
    }
});

// Starting the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
