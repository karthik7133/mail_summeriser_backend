const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Try to load from file first, then fallback to environment variable
let serviceAccount = null;

try {
  // Try to load from the JSON file in root directory
  const serviceAccountPath = path.join(__dirname, '..', 'mailgpt-47c2f-firebase-adminsdk-fbsvc-31ad5255e3.json');
  serviceAccount = require(serviceAccountPath);
  console.log('✅ Firebase service account loaded from file');
} catch (fileError) {
  // Fallback to environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('✅ Firebase service account loaded from environment variable');
    } catch (envError) {
      console.warn('❌ Failed to parse Firebase service account from environment variable');
    }
  }
}

if (!serviceAccount && !admin.apps.length) {
  console.warn('⚠️ Firebase service account not configured. Using default initialization.');
}

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    admin.initializeApp();
    console.log('⚠️ Firebase Admin SDK initialized with default settings');
  }
}

module.exports = admin;
