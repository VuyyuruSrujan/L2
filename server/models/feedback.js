const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    userEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    userRole: {
        type: String,
        enum: ['requester', 'volunteer'],
        default: 'requester'
    },
    helpRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'help_requests',
        required: true
    },
    helpRequestTitle: {
        type: String,
        required: true,
        trim: true
    },
    // Who is being rated (volunteer or requester)
    ratedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    ratedUserRole: {
        type: String,
        enum: ['requester', 'volunteer'],
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const FeedbackModel = mongoose.model('feedbacks', FeedbackSchema);
module.exports = FeedbackModel;
