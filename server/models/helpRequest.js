const mongoose = require('mongoose');

const HelpRequestSchema = new mongoose.Schema({
    // Requester details
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    requesterEmail: {
        type: String,
        required: true
    },
    requesterName: {
        type: String,
        required: true
    },
    requesterPhone: {
        type: String,
        required: true
    },
    requesterCity: {
        type: String,
        required: true
    },
    
    // Request location
    location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        },
        address: String
    },
    
    // Help request details
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['medical', 'transportation', 'grocery', 'technical', 'companionship', 'emergency', 'other'],
        default: 'other'
    },
    urgency: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // Volunteer assignment
    assignedVolunteer: {
        volunteerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        },
        volunteerEmail: String,
        volunteerName: String,
        volunteerPhone: String,
        acceptedAt: Date,
        // Real-time tracking
        currentLocation: {
            latitude: Number,
            longitude: Number,
            lastUpdated: Date
        }
    },

    // Virtual meeting link for coordination
    meetLink: {
        type: String,
        default: null
    },
    
    // Status tracking
    status: {
        type: String,
        enum: ['open', 'accepted', 'in-progress', 'completed', 'cancelled'],
        default: 'open'
    },
    
    // Timeline events
    timeline: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String,
        updatedBy: String
    }],
    
    // Completion details
    completedAt: Date,
    completionNotes: String,
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Add initial timeline entry on creation
HelpRequestSchema.pre('save', function() {
    this.updatedAt = Date.now();
    if (this.isNew) {
        this.timeline = [{
            status: 'open',
            timestamp: this.createdAt,
            note: 'Help request created'
        }];
    }
});

const HelpRequestModel = mongoose.model('help_requests', HelpRequestSchema);
module.exports = HelpRequestModel;
