const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    userEmail: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['request_created', 'request_accepted', 'request_completed', 'feedback_received', 'general'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId
    },
    relatedType: {
        type: String,
        enum: ['helpRequest', 'feedback', 'other']
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

const NotificationModel = mongoose.model("notifications", NotificationSchema);
module.exports = NotificationModel;
