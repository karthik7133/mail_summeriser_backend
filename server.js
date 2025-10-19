// server.js

// 1️⃣ Load environment variables (MUST be first)
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { connectDB } = require('./config/mongodb');
const authRoutes = require('./routes/authRoutes');
const mailRoutes = require('./routes/mailRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ====== Debug: Check if env variables are loaded ======
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Loaded' : 'Missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Loaded' : 'Missing');

// ====== Firebase Admin Initialization ======
// Firebase is already initialized in config/firebase.js
const admin = require('./config/firebase');
console.log('✅ Firebase Admin initialized successfully');

// ====== Middleware ======
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== Health Check / Default Routes ======
app.get('/', (req, res) => {
    res.json({
        message: 'Mail Summarizer API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            mails: '/api/mails',
            chat: '/api/chat',
        },
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// ====== API Routes ======
app.use('/api/auth', authRoutes);
app.use('/api/mails', mailRoutes);
app.use('/api/chat', chatRoutes);

// ====== Error Handling ======
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
    });
});

// ====== Start Server ======
const startServer = async () => {
    try {
        await connectDB(); // Connect to MongoDB
        console.log('✅ MongoDB connected successfully');

        // Explicitly bind to '0.0.0.0' to ensure accessibility in hosted environments
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Mail Summarizer API Server`);
            console.log(`📡 Server running on 0.0.0.0:${PORT}`);
            console.log(`🌐 API URL (Local access): http://localhost:${PORT}`);
            console.log(`📝 Health check: http://localhost:${PORT}/health\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
