const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebase_uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  profile_pic: {
    type: String,
    default: ''
  },
  // --- ADDED FIELDS FOR GMAIL INTEGRATION ---
  google_access_token: {
    type: String,
    default: ''
  },
  google_refresh_token: {
    type: String,
    default: ''
  },
  // ------------------------------------------
}, {
  timestamps: true
});

// Add static method to find user by Firebase UID
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebase_uid: firebaseUid });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
