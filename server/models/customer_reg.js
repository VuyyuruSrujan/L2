const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['requester', 'volunteer'],
        default: 'requester'
    },
    // Location fields for matching
    location: {
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        }
    },
    // Volunteer-specific fields
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationDetails: {
        idProof: String,
        verifiedAt: Date,
        verifiedBy: String
    },
    // Skills/services volunteer can offer
    skills: [{
        type: String,
        enum: ['medical', 'transportation', 'grocery', 'technical', 'companionship', 'emergency', 'other']
    }],
    // Availability status for volunteers
    isAvailable: {
        type: Boolean,
        default: true
    },
    // Rating and feedback
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    // Statistics
    completedRequests: {
        type: Number,
        default: 0
    },
    blocked: {
        isBlocked: {
            type: Boolean,
            default: false
        },
        blockedBy: {
            type: String
        },
        blockedAt: {
            type: Date
        },
        reason: {
            type: String
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
UserSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

const UserModel = mongoose.model("users", UserSchema);
module.exports = UserModel;
