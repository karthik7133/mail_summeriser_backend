const admin = require('../config/firebase');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.firebaseUid = decodedToken.uid;
    req.email = decodedToken.email;
    req.name = decodedToken.name || decodedToken.email;

    const user = await User.findByFirebaseUid(decodedToken.uid);

    if (user) {
      req.userId = user.id;
      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
