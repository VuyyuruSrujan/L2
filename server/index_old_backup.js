const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Stripe = require('stripe');
require('dotenv').config();

const UserModel = require('./models/customer_reg');
const ComplaintModel = require('./models/complaint');
const FeedbackModel = require('./models/feedback');

// Stripe init via environment variable
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY. Set it in a .env file or environment.');
    process.exit(1);
}
const stripe = new Stripe(STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/local_support_app", );

// Login endpoint: validates credentials and returns role for redirect
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'You are not registered. Please register first.' });
        }

        // Check if user is blocked
        if (user.blocked && user.blocked.isBlocked) {
            return res.status(403).json({ 
                message: `Your account has been blocked by ${user.blocked.blockedBy || 'admin'}. ${user.blocked.reason ? 'Reason: ' + user.blocked.reason : ''}`,
                blocked: true,
                blockedBy: user.blocked.blockedBy,
                blockedAt: user.blocked.blockedAt,
                reason: user.blocked.reason
            });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Password is incorrect' });
        }

        return res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                city: user.city,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/register', (req, res) => {
    const { name, email, password, phone, address, city, role } = req.body;
    
    console.log("Received registration request:", { name, email, phone, role });
    
    // Validate required fields based on role
    if (!name || !email || !password || !phone || !address || !role) {
        return res.status(400).json({ message: "All fields are required" });
    }
    
    // Validate city for admin and customer roles
    if ((role === 'admin' || role === 'customer') && !city) {
        return res.status(400).json({ message: "City is required for this role" });
    }
    
    // Validate role
    const validRoles = ['customer', 'admin', 'technician', 'superadmin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role specified" });
    }
    
    // Check if user already exists with any role
    UserModel.findOne({ email: email })
        .then(existingUser => {
            if (existingUser) {
                console.log("User already exists:", email, "with role:", existingUser.role);
                
                // Check if trying to register with different role
                if (existingUser.role === role) {
                    return res.status(400).json({ 
                        message: "You are already registered with this role. Please login." 
                    });
                } else {
                    return res.status(400).json({ 
                        message: `This email is already registered as ${existingUser.role}. One email can only have one role. Please use a different email or login.` 
                    });
                }
            }
            
            // If user doesn't exist, create new user
            console.log("Creating new user...");
            UserModel.create({ name, email, password, phone, address, city, role })
                .then(user => {
                    console.log("User created successfully:", user._id, "Role:", user.role);
                    res.json({ 
                        message: "Registration successful",
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            address: user.address,
                            city: user.city,
                            role: user.role
                        }
                    });
                })
                .catch(err => {
                    console.log("Error creating user:", err);
                    res.status(500).json({ message: "Error creating user", error: err.message });
                });
        })
        .catch(err => {
            console.log("Error checking existing user:", err);
            res.status(500).json({ message: "Database error", error: err.message });
        });
});

// Create complaint endpoint
app.post('/complaints/create', async (req, res) => {
    try {
        const { customerEmail, customerName, customerPhone, customerCity, title, description, category, priority } = req.body;

        if (!customerEmail || !title || !description || !category || !priority) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const user = await UserModel.findOne({ email: customerEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const complaint = await ComplaintModel.create({
            customerId: user._id,
            customerEmail,
            customerName,
            customerPhone,
            customerCity,
            title,
            description,
            category,
            priority,
            status: 'open'
        });

        console.log('Complaint created:', complaint._id);
        return res.json({ message: 'Complaint created successfully', complaint });
    } catch (err) {
        console.error('Error creating complaint:', err);
        return res.status(500).json({ message: 'Error creating complaint', error: err.message });
    }
});

// Get unassigned complaints (open status)
app.get('/complaints/unassigned', async (req, res) => {
    try {
        const complaints = await ComplaintModel.find({ status: 'open' })
            .sort({ priority: -1, createdAt: -1 });

        return res.json(complaints);
    } catch (err) {
        console.error('Error fetching unassigned complaints:', err);
        return res.status(500).json({ message: 'Error fetching complaints' });
    }
});

// Get complaints assigned to a specific admin
app.get('/complaints/admin/:adminEmail', async (req, res) => {
    try {
        const { adminEmail } = req.params;
        const complaints = await ComplaintModel.find({ 'assignedTo.adminEmail': adminEmail })
            .sort({ 'assignedTo.takenAt': -1 });

        return res.json(complaints);
    } catch (err) {
        console.error('Error fetching admin complaints:', err);
        return res.status(500).json({ message: 'Error fetching complaints' });
    }
});

// Get complaints for a specific customer
app.get('/complaints/customer/:customerEmail', async (req, res) => {
    try {
        const { customerEmail } = req.params;
        const complaints = await ComplaintModel.find({ customerEmail })
            .sort({ createdAt: -1 });

        return res.json(complaints);
    } catch (err) {
        console.error('Error fetching customer complaints:', err);
        return res.status(500).json({ message: 'Error fetching complaints' });
    }
});

// Get complaints for a specific technician
app.get('/complaints/technician/:technicianEmail', async (req, res) => {
    try {
        const { technicianEmail } = req.params;
        const complaints = await ComplaintModel.find({ 'technicianAssigned.technicianEmail': technicianEmail })
            .sort({ createdAt: -1 });

        return res.json(complaints);
    } catch (err) {
        console.error('Error fetching technician complaints:', err);
        return res.status(500).json({ message: 'Error fetching complaints' });
    }
});

// Assign complaint to admin
app.post('/complaints/:complaintId/assign', async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { adminEmail, adminName } = req.body;

        if (!adminEmail || !adminName) {
            return res.status(400).json({ message: 'Admin email and name are required' });
        }

        const complaint = await ComplaintModel.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.status !== 'open') {
            return res.status(400).json({ message: 'This complaint has already been taken by another admin' });
        }

        // Find the admin user to get their ID
        const admin = await UserModel.findOne({ email: adminEmail });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        complaint.status = 'taken';
        complaint.assignedTo = {
            adminId: admin._id,
            adminEmail,
            adminName,
            takenAt: new Date()
        };

        await complaint.save();

        console.log('Complaint assigned to:', adminEmail);
        return res.json({ message: 'Complaint assigned successfully', complaint });
    } catch (err) {
        console.error('Error assigning complaint:', err);
        return res.status(500).json({ message: 'Error assigning complaint', error: err.message });
    }
});

// Get technicians with workload status
app.get('/technicians/available', async (req, res) => {
    try {
        // Get all technicians
        const allTechnicians = await UserModel.find({ role: 'technician' }).select('-password');

        // Get complaints that are currently assigned to technicians (not resolved or closed)
        const activeComplaints = await ComplaintModel.find({
            'technicianAssigned.technicianId': { $exists: true },
            status: { $in: ['assigned', 'in-progress'] }
        });

        // Count active complaints per technician
        const activeCountMap = activeComplaints.reduce((map, c) => {
            const techId = c.technicianAssigned.technicianId.toString();
            map[techId] = (map[techId] || 0) + 1;
            return map;
        }, {});

        // Shape response with workload info
        const techniciansWithStatus = allTechnicians.map((tech) => {
            const activeCount = activeCountMap[tech._id.toString()] || 0;
            return {
                _id: tech._id,
                name: tech.name,
                email: tech.email,
                phone: tech.phone,
                city: tech.city,
                role: tech.role,
                activeCount,
                available: activeCount === 0,
            };
        });

        return res.json(techniciansWithStatus);
    } catch (err) {
        console.error('Error fetching available technicians:', err);
        return res.status(500).json({ message: 'Error fetching technicians' });
    }
});

// Assign complaint to technician
app.post('/complaints/:complaintId/assign-technician', async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { technicianEmail, technicianName } = req.body;

        if (!technicianEmail || !technicianName) {
            return res.status(400).json({ message: 'Technician email and name are required' });
        }

        const complaint = await ComplaintModel.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.status !== 'taken') {
            return res.status(400).json({ message: 'This complaint cannot be assigned to a technician' });
        }

        // Find the technician
        const technician = await UserModel.findOne({ email: technicianEmail });
        if (!technician) {
            return res.status(404).json({ message: 'Technician not found' });
        }

        // Check if technician is already assigned to another active complaint
        const existingAssignment = await ComplaintModel.findOne({
            'technicianAssigned.technicianId': technician._id,
            status: { $in: ['assigned', 'in-progress'] }
        });

        if (existingAssignment) {
            return res.status(400).json({ message: 'This technician is already assigned to another complaint' });
        }

        complaint.status = 'assigned';
        complaint.technicianAssigned = {
            technicianId: technician._id,
            technicianEmail,
            technicianName,
            technicianPhone: technician.phone,
            assignedAt: new Date()
        };

        await complaint.save();

        console.log('Complaint assigned to technician:', technicianEmail);
        return res.json({ message: 'Complaint assigned to technician successfully', complaint });
    } catch (err) {
        console.error('Error assigning complaint to technician:', err);
        return res.status(500).json({ message: 'Error assigning complaint', error: err.message });
    }
});

// Technician starts working (moves to in-progress)
app.post('/complaints/:complaintId/start', async (req, res) => {
    try {
        const { complaintId } = req.params;

        const complaint = await ComplaintModel.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.status !== 'assigned') {
            return res.status(400).json({ message: 'Complaint is not ready to start' });
        }

        complaint.status = 'in-progress';
        complaint.updatedAt = new Date();
        await complaint.save();

        return res.json({ message: 'Complaint marked in progress', complaint });
    } catch (err) {
        console.error('Error starting complaint work:', err);
        return res.status(500).json({ message: 'Error updating complaint', error: err.message });
    }
});

// Technician resolves the complaint
app.post('/complaints/:complaintId/resolve', async (req, res) => {
    try {
        const { complaintId } = req.params;

        const complaint = await ComplaintModel.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (!['in-progress', 'assigned'].includes(complaint.status)) {
            return res.status(400).json({ message: 'Complaint is not in progress' });
        }

        complaint.status = 'resolved';
        complaint.updatedAt = new Date();
        await complaint.save();

        return res.json({ message: 'Complaint resolved', complaint });
    } catch (err) {
        console.error('Error resolving complaint:', err);
        return res.status(500).json({ message: 'Error updating complaint', error: err.message });
    }
});

// Create Stripe Checkout session
app.post('/payments/stripe/create-session', async (req, res) => {
    try {
        const { complaintId } = req.body;

        if (!complaintId) {
            return res.status(400).json({ message: 'Complaint ID is required' });
        }

        const complaint = await ComplaintModel.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.status !== 'resolved') {
            return res.status(400).json({ message: 'Complaint must be resolved before payment' });
        }

        const amount = complaint.payment?.amount || complaint.totalAmount || 500;
        const amountInPaise = Math.round(amount * 100);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: `Complaint: ${complaint.title}`
                        },
                        unit_amount: amountInPaise
                    },
                    quantity: 1
                }
            ],
            metadata: {
                complaintId: complaintId
            },
            success_url: `http://localhost:5173/?payment=success&complaintId=${complaintId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:5173/?payment=cancel`
        });

        return res.json({
            sessionId: session.id,
            sessionUrl: session.url,
            amount,
            currency: 'INR'
        });
    } catch (err) {
        console.error('Error creating Stripe session:', err);
        return res.status(500).json({ message: 'Error creating payment session', error: err.message });
    }
});

// Confirm Stripe payment and update complaint
app.post('/payments/stripe/confirm', async (req, res) => {
    try {
        const { sessionId, complaintId } = req.body;

        if (!sessionId || !complaintId) {
            return res.status(400).json({ message: 'sessionId and complaintId are required' });
        }

        const complaint = await ComplaintModel.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return res.status(400).json({ message: 'Payment not completed' });
        }

        complaint.status = 'closed';
        complaint.payment = {
            status: 'completed',
            amount: (session.amount_total || 0) / 100,
            transactionId: session.payment_intent,
            paymentMethod: 'stripe',
            paidAt: new Date(),
            paymentDetails: {
                sessionId: session.id,
                customerEmail: session.customer_details?.email,
                currency: session.currency,
                amountTotal: session.amount_total
            }
        };
        complaint.updatedAt = new Date();

        await complaint.save();

        return res.json({
            success: true,
            message: 'Payment verified and complaint closed',
            complaint
        });
    } catch (err) {
        console.error('Error confirming Stripe payment:', err);
        return res.status(500).json({ message: 'Error confirming payment', error: err.message });
    }
});

// Customer feedback: create feedback entry (only when complaint is resolved, before payment)
app.post('/feedbacks/create', async (req, res) => {
    try {
        const { userId, userEmail, userName, userRole = 'customer', rating, comment, complaintId } = req.body;

        if (!userId || !userEmail || !userName || !rating || !comment || !complaintId) {
            return res.status(400).json({ message: 'userId, userEmail, userName, rating, comment, and complaintId are required' });
        }

        const numericRating = Number(rating);
        if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const complaint = await ComplaintModel.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.customerId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can only give feedback on your own complaint' });
        }

        if (complaint.status !== 'resolved') {
            return res.status(400).json({ message: 'Feedback can be submitted only when complaint is resolved and before payment' });
        }

        const existing = await FeedbackModel.findOne({ complaintId, userId });
        if (existing) {
            return res.status(400).json({ message: 'Feedback already submitted for this complaint' });
        }

        const feedback = await FeedbackModel.create({
            userId,
            userEmail,
            userName,
            userRole,
            complaintId,
            complaintTitle: complaint.title,
            rating: numericRating,
            comment
        });

        return res.json({ message: 'Feedback submitted successfully', feedback });
    } catch (err) {
        console.error('Error submitting feedback:', err);
        return res.status(500).json({ message: 'Error submitting feedback', error: err.message });
    }
});

// Customer feedback: fetch feedbacks for a specific customer
app.get('/feedbacks/customer/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { email } = req.query;

        const filters = [];
        if (userId) {
            filters.push({ userId });
        }
        if (email) {
            filters.push({ userEmail: email });
        }

        const criteria = filters.length > 0 ? { $or: filters } : {};
        const feedbacks = await FeedbackModel.find(criteria).sort({ createdAt: -1 });

        return res.json(feedbacks);
    } catch (err) {
        console.error('Error fetching customer feedbacks:', err);
        return res.status(500).json({ message: 'Error fetching feedbacks', error: err.message });
    }
});

// Super Admin: fetch all feedbacks
app.get('/feedbacks', async (_req, res) => {
    try {
        const feedbacks = await FeedbackModel.find({}).sort({ createdAt: -1 });
        return res.json(feedbacks);
    } catch (err) {
        console.error('Error fetching all feedbacks:', err);
        return res.status(500).json({ message: 'Error fetching feedbacks', error: err.message });
    }
});

// Super Admin: Get all complaints with complete details
app.get('/superadmin/complaints/all', async (req, res) => {
    try {
        const complaints = await ComplaintModel.find({})
            .sort({ createdAt: -1 });

        return res.json(complaints);
    } catch (err) {
        console.error('Error fetching all complaints:', err);
        return res.status(500).json({ message: 'Error fetching complaints' });
    }
});

// Super Admin: Mark technician payment as paid
app.post('/superadmin/complaints/:complaintId/pay-technician', async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { amount, paidBy, notes } = req.body;

        const complaint = await ComplaintModel.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        complaint.technicianPayment = {
            status: 'completed',
            amount: amount || 300,
            paidAt: new Date(),
            paidBy: paidBy || 'admin',
            notes: notes || 'Payment completed'
        };
        complaint.updatedAt = new Date();

        await complaint.save();

        return res.json({ 
            message: 'Technician payment marked as completed', 
            complaint 
        });
    } catch (err) {
        console.error('Error marking technician payment:', err);
        return res.status(500).json({ message: 'Error updating payment', error: err.message });
    }
});

// Super Admin: Get all admins
app.get('/superadmin/admins', async (req, res) => {
    try {
        const admins = await UserModel.find({ role: 'admin' }).select('-password');
        return res.json(admins);
    } catch (err) {
        console.error('Error fetching admins:', err);
        return res.status(500).json({ message: 'Error fetching admins' });
    }
});

// Super Admin: Block/Unblock admin
app.post('/superadmin/admins/:adminId/toggle-block', async (req, res) => {
    try {
        const { adminId } = req.params;
        const { blockedBy, reason } = req.body;

        const admin = await UserModel.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (admin.role !== 'admin') {
            return res.status(400).json({ message: 'User is not an admin' });
        }

        // Toggle blocked status
        const isCurrentlyBlocked = admin.blocked?.isBlocked || false;
        
        if (isCurrentlyBlocked) {
            // Unblock
            admin.blocked = {
                isBlocked: false,
                blockedBy: null,
                blockedAt: null,
                reason: null
            };
        } else {
            // Block
            admin.blocked = {
                isBlocked: true,
                blockedBy: blockedBy || 'Super Admin',
                blockedAt: new Date(),
                reason: reason || 'Blocked by super admin'
            };
        }

        admin.updatedAt = new Date();
        await admin.save();

        return res.json({ 
            message: isCurrentlyBlocked ? 'Admin unblocked successfully' : 'Admin blocked successfully',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                blocked: admin.blocked
            }
        });
    } catch (err) {
        console.error('Error toggling admin block status:', err);
        return res.status(500).json({ message: 'Error updating admin status', error: err.message });
    }
});

// Super Admin: Get statistics
app.get('/superadmin/statistics', async (req, res) => {
    try {
        const totalComplaints = await ComplaintModel.countDocuments();
        const openComplaints = await ComplaintModel.countDocuments({ status: 'open' });
        const closedComplaints = await ComplaintModel.countDocuments({ status: 'closed' });
        const resolvedComplaints = await ComplaintModel.countDocuments({ status: 'resolved' });
        const inProgressComplaints = await ComplaintModel.countDocuments({ status: 'in-progress' });
        
        const totalRevenue = await ComplaintModel.aggregate([
            { $match: { 'payment.status': 'completed' } },
            { $group: { _id: null, total: { $sum: '$payment.amount' } } }
        ]);

        const totalAdmins = await UserModel.countDocuments({ role: 'admin' });
        const totalTechnicians = await UserModel.countDocuments({ role: 'technician' });
        const totalCustomers = await UserModel.countDocuments({ role: 'customer' });

        return res.json({
            complaints: {
                total: totalComplaints,
                open: openComplaints,
                closed: closedComplaints,
                resolved: resolvedComplaints,
                inProgress: inProgressComplaints
            },
            revenue: totalRevenue[0]?.total || 0,
            users: {
                admins: totalAdmins,
                technicians: totalTechnicians,
                customers: totalCustomers
            }
        });
    } catch (err) {
        console.error('Error fetching statistics:', err);
        return res.status(500).json({ message: 'Error fetching statistics' });
    }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
}); 