// config/firebase.js

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// ==================================================
// Firebase Admin Initialization
// ==================================================
let serviceAccount = null;

try {
  // 1️⃣ Try loading local JSON (for local development)
  const localPath = path.join(__dirname, '..', 'mailgpt-47c2f-firebase-adminsdk-fbsvc-31ad5255e3.json');
  serviceAccount = require(localPath);
  console.log('✅ Firebase service account loaded from local file');
} catch (fileError) {
  // 2️⃣ Fallback to Render environment variable
  if (process.env.FIREBASE_CONFIG || process.env.FIREBASE_SERVICE_ACCOUNT) {
    const rawJson = process.env.FIREBASE_CONFIG || process.env.FIREBASE_SERVICE_ACCOUNT;
    try {
      serviceAccount = JSON.parse(rawJson);
      console.log('✅ Firebase service account loaded from environment variable');
    } catch (parseError) {
      console.error('❌ Failed to parse Firebase config JSON from environment:', parseError.message);
    }
  } else {
    console.warn('⚠️ No Firebase service account found in environment variables.');
  }
}

// ==================================================
// Initialize Firebase
// ==================================================
if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('🔥 Firebase Admin SDK initialized with credentials');
  } else {
    admin.initializeApp(); // fallback for limited public APIs
    console.warn('⚠️ Firebase initialized with default credentials (limited access)');
  }
}

// ==================================================
// Export admin for use across the app
// ==================================================
module.exports = admin;
