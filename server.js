// server.js

// ==================================================
// 1️⃣ Load environment variables first
// ==================================================
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/mongodb');

// ==================================================
// 2️⃣ Initialize Express
// ==================================================
const app = express();
const PORT = process.env.PORT || 5000;

// ==================================================
// 3️⃣ Debug environment (safe for Render logs)
// ==================================================
console.log('🔍 Checking environment variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('FIREBASE_CONFIG:', process.env.FIREBASE_CONFIG ? '✅ Loaded' : '❌ Missing');

// ==================================================
// 4️⃣ Firebase Admin Initialization
// ==================================================
// config/firebase.js should export an initialized admin instance
try {
    const admin = require('./config/firebase');
    console.log('✅ Firebase Admin initialized successfully');
} catch (err) {
    console.error('❌ Firebase initialization failed:', err.message);
}

// ==================================================
// 5️⃣ Middleware
// ==================================================
app.use(cors({
    origin: '*', // you can restrict this to specific domains if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================================================
// 6️⃣ Health Check + Default Route
// ==================================================
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

// ==================================================
// 7️⃣ Routes
// ==================================================
const authRoutes = require('./routes/authRoutes');
const mailRoutes = require('./routes/mailRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/mails', mailRoutes);
app.use('/api/chat', chatRoutes);

// ==================================================
// 8️⃣ Error Handling
// ==================================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
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

// ==================================================
// 9️⃣ Start Server
// ==================================================
const startServer = async () => {
    try {
        await connectDB();
        console.log('✅ MongoDB connected successfully');

        // Important for Render — bind to 0.0.0.0
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Mail Summarizer API Server`);
            console.log(`📡 Running on 0.0.0.0:${PORT}`);
            console.log(`🩺 Health: http://localhost:${PORT}/health\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// ==================================================
// 🔚 Export (for testing or imports)
// ==================================================
module.exports = app;
