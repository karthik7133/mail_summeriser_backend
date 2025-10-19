const mongoose = require('mongoose');

const mailSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mail_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  from_address: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    default: ''
  },
  body: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    default: ''
  },
  received_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
mailSchema.index({ user_id: 1, received_at: -1 });

const Mail = mongoose.model('Mail', mailSchema);

module.exports = Mail;
