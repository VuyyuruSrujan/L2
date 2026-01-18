const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    // Customer details
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    customerCity: {
        type: String,
        required: true
    },
    
    // Complaint details
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
        enum: ['electrical', 'plumbing', 'cleaning', 'maintenance', 'other'],
        default: 'other'
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },

    // Payment
    totalAmount: {
        type: Number,
        default: 500
    },
    payment: {
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        amount: {
            type: Number,
            default: 500
        },
        transactionId: String,
        paymentMethod: String,
        paidAt: Date,
        paymentDetails: Object
    },
    
    // Technician payment
    technicianPayment: {
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        amount: {
            type: Number,
            default: 300
        },
        paidAt: Date,
        paidBy: String,
        notes: String
    },
    
    // Admin assignment
    assignedTo: {
        adminId: mongoose.Schema.Types.ObjectId,
        adminEmail: String,
        adminName: String,
        takenAt: Date
    },
    
    // Technician assignment
    technicianAssigned: {
        technicianId: mongoose.Schema.Types.ObjectId,
        technicianEmail: String,
        technicianName: String,
        technicianPhone: String,
        assignedAt: Date
    },
    
    // Status tracking
    status: {
        type: String,
        enum: ['open', 'taken', 'assigned', 'in-progress', 'resolved', 'closed'],
        default: 'open'
    },
    
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

// Update updatedAt on save
ComplaintSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

const ComplaintModel = mongoose.model('complaints', ComplaintSchema);
module.exports = ComplaintModel;
