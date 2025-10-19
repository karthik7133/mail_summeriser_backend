const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mail_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mail',
    required: true,
    index: true
  },
  messages: [messageSchema]
}, {
  timestamps: true
});

// Index for efficient queries
chatSchema.index({ user_id: 1, mail_id: 1 });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
