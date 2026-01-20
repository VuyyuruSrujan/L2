const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Customer', 'Volunteer']
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },
  receiverModel: {
    type: String,
    required: true,
    enum: ['Customer', 'Volunteer']
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  helpRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HelpRequest',
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);
