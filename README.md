# 🌱 PlantasticCare - Simplifying Plant Care

A user-friendly web platform for plant lovers with comprehensive guides, care tips, and an interactive community forum.

## 🌐 Live Demo

**[Click here for Demo](https://plantasticcare.onrender.com)**

## ✨ Features

### 🌿 Plant Library
- Browse 40+ indoor plants with detailed care information
- Filter by maintenance level, sunlight needs, climate, and more
- Real-time search functionality
- Add plants to favorites

### 📚 Care Guides
- Comprehensive watering and lighting guides
- Pest control and troubleshooting tips
- Propagation techniques
- External resource links

### 💬 Community Forum
- Share plant care tips and experiences
- Ask questions and get answers
- Upvote/downvote posts
- Comment on discussions

### 👤 User Features
- Secure registration and login
- Personal dashboard
- Favorite plants collection
- Profile management

### 📱 Progressive Web App (PWA)
- Installable on mobile and desktop
- Offline support
- Fast loading with caching

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive design with mobile hamburger menu
- Toast notifications
- PWA with service worker

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- JWT authentication
- Rate limiting for security
- XSS protection

## 📂 Project Structure

```
PlantasticCare/
├── backend/
│   ├── server.js          # Main server file
│   ├── package.json       # Dependencies
│   ├── .env.example       # Environment template
│   └── .env               # Environment variables (not in git)
├── frontend/
│   ├── index.html         # Homepage
│   ├── plants.html        # Plant library
│   ├── care.html          # Care guides
│   ├── about.html         # About page
│   ├── forum.html         # Community forum
│   ├── login.html         # Login/Register + Dashboard
│   ├── 404.html           # Error page
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   ├── images/            # Image assets
│   └── data/              # Plant data JSON
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kvkushal/PlantasticCare.git
   cd PlantasticCare
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your values:
   ```env
   JWT_SECRET=your_secret_key_here
   MONGODB_URI=mongodb://localhost:27017/PlantasticCare
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:5000
   ```

## 🔒 Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for JWT token signing |
| `MONGODB_URI` | MongoDB connection string |
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Environment (development/production) |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) |

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |

### Plants & Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plants` | Get all plants |
| GET | `/favorites` | Get user favorites |
| POST | `/favorites` | Add to favorites |
| DELETE | `/favorites/:plantName` | Remove from favorites |

### Forum
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | Get all posts |
| POST | `/posts` | Create new post |
| POST | `/posts/:id/vote` | Vote on post |
| POST | `/posts/:id/comments` | Add comment |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/newsletter` | Subscribe to newsletter |
| POST | `/contact` | Submit contact form |

## 🎨 Features Highlights

- **Mobile Responsive** - Hamburger menu for mobile devices
- **Real-time Search** - Filter plants as you type
- **Scroll-to-Top** - Easy navigation on long pages
- **Dynamic Year** - Footer copyright auto-updates
- **Toast Notifications** - User-friendly feedback
- **Secure Authentication** - JWT with bcrypt password hashing
- **Rate Limiting** - Protection against abuse

## 👨‍💻 Author

**Kushal KV**
- GitHub: [@kvkushal](https://github.com/kvkushal)

## 📄 License

This project is licensed under the ISC License.

---

Helping plant parents grow greener, one leaf at a time 🌿