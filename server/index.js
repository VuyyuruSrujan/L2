const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
require('dotenv').config();

const UserModel = require('./models/customer_reg');
const HelpRequestModel = require('./models/helpRequest');
const FeedbackModel = require('./models/feedback');
const NotificationModel = require('./models/notification');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/local_support_app");

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Helper function to send email notifications
async function sendEmailNotification(to, subject, htmlContent) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'Local Support <noreply@localsupport.com>',
            to,
            subject,
            html: htmlContent
        };
        await transporter.sendMail(mailOptions);
        console.log('Email sent to:', to);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Helper function to create notification
async function createNotification(userId, userEmail, type, title, message, relatedId = null, relatedType = null) {
    try {
        await NotificationModel.create({
            userId,
            userEmail,
            type,
            title,
            message,
            relatedId,
            relatedType
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

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
                message: `Your account has been blocked. ${user.blocked.reason ? 'Reason: ' + user.blocked.reason : ''}`,
                blocked: true,
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
                location: user.location,
                isVerified: user.isVerified,
                skills: user.skills,
                isAvailable: user.isAvailable,
                rating: user.rating
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Register endpoint
app.post('/register', (req, res) => {
    const { name, email, password, phone, address, city, role, skills, location } = req.body;
    
    console.log("Received registration request:", { name, email, phone, role });
    
    // Validate required fields
    if (!name || !email || !password || !phone || !address || !city || !role) {
        return res.status(400).json({ message: "All fields are required" });
    }
    
    // Validate role
    const validRoles = ['requester', 'volunteer'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role specified. Must be 'requester' or 'volunteer'" });
    }
    
    // Check if user already exists
    UserModel.findOne({ email: email })
        .then(existingUser => {
            if (existingUser) {
                console.log("User already exists:", email, "with role:", existingUser.role);
                return res.status(400).json({ 
                    message: "This email is already registered. Please login." 
                });
            }
            
            // Create user data object
            const userData = { 
                name, 
                email, 
                password, 
                phone, 
                address, 
                city, 
                role,
                location: location || { latitude: null, longitude: null }
            };

            // Add volunteer-specific fields
            if (role === 'volunteer') {
                userData.skills = skills || [];
                userData.isAvailable = true;
            }
            
            // Create new user
            console.log("Creating new user...");
            UserModel.create(userData)
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
                            role: user.role,
                            skills: user.skills,
                            isAvailable: user.isAvailable
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

// Update user location
app.post('/users/update-location', async (req, res) => {
    try {
        const { userId, latitude, longitude } = req.body;

        if (!userId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'User ID and location coordinates are required' });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.location = { latitude, longitude };
        await user.save();

        return res.json({ message: 'Location updated successfully', location: user.location });
    } catch (err) {
        console.error('Error updating location:', err);
        return res.status(500).json({ message: 'Error updating location', error: err.message });
    }
});

// Update volunteer availability
app.post('/volunteers/toggle-availability', async (req, res) => {
    try {
        const { volunteerId } = req.body;

        if (!volunteerId) {
            return res.status(400).json({ message: 'Volunteer ID is required' });
        }

        const volunteer = await UserModel.findById(volunteerId);
        if (!volunteer || volunteer.role !== 'volunteer') {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        volunteer.isAvailable = !volunteer.isAvailable;
        await volunteer.save();

        return res.json({ 
            message: `Availability updated to ${volunteer.isAvailable ? 'available' : 'unavailable'}`,
            isAvailable: volunteer.isAvailable 
        });
    } catch (err) {
        console.error('Error toggling availability:', err);
        return res.status(500).json({ message: 'Error updating availability', error: err.message });
    }
});

// Create help request
app.post('/help-requests/create', async (req, res) => {
    try {
        const { 
            requesterEmail, 
            requesterName, 
            requesterPhone, 
            requesterCity,
            title, 
            description, 
            category, 
            urgency,
            location
        } = req.body;

        if (!requesterEmail || !title || !description || !category || !urgency || !location) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const user = await UserModel.findOne({ email: requesterEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const helpRequest = await HelpRequestModel.create({
            requesterId: user._id,
            requesterEmail,
            requesterName,
            requesterPhone,
            requesterCity,
            title,
            description,
            category,
            urgency,
            location,
            status: 'open'
        });

        console.log('Help request created:', helpRequest._id);

        // Notify available volunteers in the same city
        try {
            const availableVolunteers = await UserModel.find({
                role: 'volunteer',
                city: requesterCity,
                availability: true
            });

            console.log(`Found ${availableVolunteers.length} available volunteers in ${requesterCity}`);

            for (const volunteer of availableVolunteers) {
                const notificationTitle = `New Help Request: ${title}`;
                const notificationMessage = `${requesterName} needs help with ${category} (${urgency} urgency) in ${requesterCity}. Description: ${description}`;
                
                // Create in-app notification
                await createNotification(
                    volunteer._id,
                    volunteer.email,
                    'request_created',
                    notificationTitle,
                    notificationMessage,
                    helpRequest._id,
                    'HelpRequest'
                );

                // Send email notification
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">New Help Request Available</h2>
                        <p>Hi ${volunteer.name},</p>
                        <p>A new help request has been posted in your area:</p>
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #1f2937;">${title}</h3>
                            <p><strong>Category:</strong> ${category}</p>
                            <p><strong>Urgency:</strong> ${urgency}</p>
                            <p><strong>Location:</strong> ${location}, ${requesterCity}</p>
                            <p><strong>Description:</strong> ${description}</p>
                            <p><strong>Requester:</strong> ${requesterName}</p>
                            <p><strong>Contact:</strong> ${requesterPhone}</p>
                        </div>
                        <p>Log in to your dashboard to accept this request if you're available to help!</p>
                        <p style="color: #6b7280; font-size: 0.9em;">This is an automated notification from Local Support App.</p>
                    </div>
                `;
                
                await sendEmailNotification(
                    volunteer.email,
                    notificationTitle,
                    emailHtml
                );
            }
        } catch (notifError) {
            console.error('Error sending notifications:', notifError);
            // Don't fail the request creation if notifications fail
        }

        return res.json({ message: 'Help request created successfully', helpRequest });
    } catch (err) {
        console.error('Error creating help request:', err);
        return res.status(500).json({ message: 'Error creating help request', error: err.message });
    }
});

// Get open help requests (for volunteers to view)
app.get('/help-requests/open', async (req, res) => {
    try {
        const { city, category } = req.query;
        
        let query = { status: 'open' };
        
        if (city) {
            query.requesterCity = city;
        }
        
        if (category) {
            query.category = category;
        }

        const requests = await HelpRequestModel.find(query)
            .sort({ urgency: -1, createdAt: -1 });

        return res.json(requests);
    } catch (err) {
        console.error('Error fetching open help requests:', err);
        return res.status(500).json({ message: 'Error fetching help requests' });
    }
});

// Get help requests for a specific requester
app.get('/help-requests/requester/:requesterEmail', async (req, res) => {
    try {
        const { requesterEmail } = req.params;
        const requests = await HelpRequestModel.find({ requesterEmail })
            .sort({ createdAt: -1 });

        return res.json(requests);
    } catch (err) {
        console.error('Error fetching requester help requests:', err);
        return res.status(500).json({ message: 'Error fetching help requests' });
    }
});

// Get help requests accepted by a specific volunteer
app.get('/help-requests/volunteer/:volunteerEmail', async (req, res) => {
    try {
        const { volunteerEmail } = req.params;
        const requests = await HelpRequestModel.find({ 
            'assignedVolunteer.volunteerEmail': volunteerEmail 
        }).sort({ createdAt: -1 });

        return res.json(requests);
    } catch (err) {
        console.error('Error fetching volunteer help requests:', err);
        return res.status(500).json({ message: 'Error fetching help requests' });
    }
});

// Get a single help request by ID
app.get('/help-requests/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await HelpRequestModel.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: 'Help request not found' });
        }

        return res.json(request);
    } catch (err) {
        console.error('Error fetching help request:', err);
        return res.status(500).json({ message: 'Error fetching help request' });
    }
});

// Volunteer accepts a help request
app.post('/help-requests/:requestId/accept', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { volunteerEmail, volunteerName, volunteerPhone } = req.body;

        if (!volunteerEmail || !volunteerName) {
            return res.status(400).json({ message: 'Volunteer email and name are required' });
        }

        const helpRequest = await HelpRequestModel.findById(requestId);
        if (!helpRequest) {
            return res.status(404).json({ message: 'Help request not found' });
        }

        if (helpRequest.status !== 'open') {
            return res.status(400).json({ message: 'This request has already been accepted' });
        }

        const volunteer = await UserModel.findOne({ email: volunteerEmail });
        if (!volunteer || volunteer.role !== 'volunteer') {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        helpRequest.status = 'accepted';
        helpRequest.assignedVolunteer = {
            volunteerId: volunteer._id,
            volunteerEmail,
            volunteerName,
            volunteerPhone,
            acceptedAt: new Date()
        };
        helpRequest.timeline.push({
            status: 'accepted',
            timestamp: new Date(),
            note: `Accepted by volunteer ${volunteerName}`
        });

        await helpRequest.save();

        console.log('Help request accepted by:', volunteerEmail);

        // Notify the requester that their request was accepted
        try {
            const requester = await UserModel.findById(helpRequest.requesterId);
            if (requester) {
                const notificationTitle = `Your Request Was Accepted!`;
                const notificationMessage = `${volunteerName} has accepted your help request "${helpRequest.title}". They will contact you soon at ${helpRequest.requesterPhone}.`;
                
                // Create in-app notification
                await createNotification(
                    requester._id,
                    requester.email,
                    'request_accepted',
                    notificationTitle,
                    notificationMessage,
                    helpRequest._id,
                    'HelpRequest'
                );

                // Send email notification
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #10b981;">Great News! Your Request Was Accepted</h2>
                        <p>Hi ${helpRequest.requesterName},</p>
                        <p>Your help request has been accepted by a volunteer!</p>
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #1f2937;">${helpRequest.title}</h3>
                            <p><strong>Volunteer:</strong> ${volunteerName}</p>
                            <p><strong>Contact:</strong> ${volunteerPhone}</p>
                            <p><strong>Accepted at:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <p>The volunteer will reach out to you soon to coordinate the help. You can also contact them at the phone number above.</p>
                        <p style="color: #6b7280; font-size: 0.9em;">This is an automated notification from Local Support App.</p>
                    </div>
                `;
                
                await sendEmailNotification(
                    requester.email,
                    notificationTitle,
                    emailHtml
                );
            }
        } catch (notifError) {
            console.error('Error sending acceptance notification:', notifError);
        }

        return res.json({ message: 'Help request accepted successfully', helpRequest });
    } catch (err) {
        console.error('Error accepting help request:', err);
        return res.status(500).json({ message: 'Error accepting help request', error: err.message });
    }
});

// Update help request status (in-progress, completed)
app.post('/help-requests/:requestId/update-status', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, note } = req.body;

        const validStatuses = ['in-progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const helpRequest = await HelpRequestModel.findById(requestId);
        if (!helpRequest) {
            return res.status(404).json({ message: 'Help request not found' });
        }

        helpRequest.status = status;
        helpRequest.timeline.push({
            status,
            timestamp: new Date(),
            note: note || `Status updated to ${status}`
        });

        if (status === 'completed') {
            helpRequest.completedAt = new Date();
            
            // Update volunteer's completed requests count
            if (helpRequest.assignedVolunteer && helpRequest.assignedVolunteer.volunteerId) {
                await UserModel.findByIdAndUpdate(
                    helpRequest.assignedVolunteer.volunteerId,
                    { $inc: { completedRequests: 1 } }
                );
            }
        }

        await helpRequest.save();

        // Send notification on completion
        if (status === 'completed') {
            try {
                // Notify requester
                const requester = await UserModel.findById(helpRequest.requesterId);
                if (requester) {
                    const requesterTitle = `Request Completed: ${helpRequest.title}`;
                    const requesterMessage = `Your help request "${helpRequest.title}" has been marked as completed by ${helpRequest.assignedVolunteer?.volunteerName}. Please consider leaving feedback!`;
                    
                    await createNotification(
                        requester._id,
                        requester.email,
                        'request_completed',
                        requesterTitle,
                        requesterMessage,
                        helpRequest._id,
                        'HelpRequest'
                    );

                    const requesterEmailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #10b981;">Request Completed!</h2>
                            <p>Hi ${helpRequest.requesterName},</p>
                            <p>Your help request has been completed:</p>
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                <h3 style="margin-top: 0; color: #1f2937;">${helpRequest.title}</h3>
                                <p><strong>Volunteer:</strong> ${helpRequest.assignedVolunteer?.volunteerName}</p>
                                <p><strong>Completed at:</strong> ${new Date().toLocaleString()}</p>
                            </div>
                            <p>We hope you received the help you needed! Please consider leaving feedback about your experience.</p>
                            <p style="color: #6b7280; font-size: 0.9em;">This is an automated notification from Local Support App.</p>
                        </div>
                    `;
                    
                    await sendEmailNotification(requester.email, requesterTitle, requesterEmailHtml);
                }

                // Notify volunteer
                if (helpRequest.assignedVolunteer?.volunteerId) {
                    const volunteer = await UserModel.findById(helpRequest.assignedVolunteer.volunteerId);
                    if (volunteer) {
                        const volunteerTitle = `Request Completed: ${helpRequest.title}`;
                        const volunteerMessage = `You have successfully completed the help request "${helpRequest.title}" for ${helpRequest.requesterName}. Thank you for your service!`;
                        
                        await createNotification(
                            volunteer._id,
                            volunteer.email,
                            'request_completed',
                            volunteerTitle,
                            volunteerMessage,
                            helpRequest._id,
                            'HelpRequest'
                        );

                        const volunteerEmailHtml = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #10b981;">Great Job!</h2>
                                <p>Hi ${volunteer.name},</p>
                                <p>You have successfully completed a help request:</p>
                                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                    <h3 style="margin-top: 0; color: #1f2937;">${helpRequest.title}</h3>
                                    <p><strong>For:</strong> ${helpRequest.requesterName}</p>
                                    <p><strong>Completed at:</strong> ${new Date().toLocaleString()}</p>
                                </div>
                                <p>Thank you for making a difference in your community! Your total completed requests: ${volunteer.completedRequests || 0}</p>
                                <p style="color: #6b7280; font-size: 0.9em;">This is an automated notification from Local Support App.</p>
                            </div>
                        `;
                        
                        await sendEmailNotification(volunteer.email, volunteerTitle, volunteerEmailHtml);
                    }
                }
            } catch (notifError) {
                console.error('Error sending completion notifications:', notifError);
            }
        }

        return res.json({ message: 'Status updated successfully', helpRequest });
    } catch (err) {
        console.error('Error updating status:', err);
        return res.status(500).json({ message: 'Error updating status', error: err.message });
    }
});

// Update volunteer's real-time location during help
app.post('/help-requests/:requestId/update-location', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Location coordinates are required' });
        }

        const helpRequest = await HelpRequestModel.findById(requestId);
        if (!helpRequest) {
            return res.status(404).json({ message: 'Help request not found' });
        }

        if (!helpRequest.assignedVolunteer) {
            return res.status(400).json({ message: 'No volunteer assigned to this request' });
        }

        helpRequest.assignedVolunteer.currentLocation = {
            latitude,
            longitude,
            lastUpdated: new Date()
        };

        await helpRequest.save();

        return res.json({ message: 'Location updated successfully', location: helpRequest.assignedVolunteer.currentLocation });
    } catch (err) {
        console.error('Error updating volunteer location:', err);
        return res.status(500).json({ message: 'Error updating location', error: err.message });
    }
});

// Create feedback after help is completed
app.post('/feedbacks/create', async (req, res) => {
    try {
        const { 
            userId, 
            userEmail, 
            userName, 
            userRole,
            helpRequestId,
            helpRequestTitle,
            ratedUserId,
            ratedUserRole,
            rating, 
            comment 
        } = req.body;

        if (!userId || !userEmail || !userName || !helpRequestId || !ratedUserId || !rating || !comment) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const numericRating = Number(rating);
        if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const helpRequest = await HelpRequestModel.findById(helpRequestId);
        if (!helpRequest) {
            return res.status(404).json({ message: 'Help request not found' });
        }

        if (helpRequest.status !== 'completed') {
            return res.status(400).json({ message: 'Feedback can only be submitted for completed requests' });
        }

        // Check if feedback already exists
        const existing = await FeedbackModel.findOne({ helpRequestId, userId });
        if (existing) {
            return res.status(400).json({ message: 'Feedback already submitted for this request' });
        }

        const feedback = await FeedbackModel.create({
            userId,
            userEmail,
            userName,
            userRole,
            helpRequestId,
            helpRequestTitle,
            ratedUserId,
            ratedUserRole,
            rating: numericRating,
            comment
        });

        // Update the rated user's average rating
        const ratedUser = await UserModel.findById(ratedUserId);
        if (ratedUser) {
            const currentAvg = ratedUser.rating.average || 0;
            const currentCount = ratedUser.rating.count || 0;
            const newCount = currentCount + 1;
            const newAvg = ((currentAvg * currentCount) + numericRating) / newCount;
            
            ratedUser.rating = {
                average: Math.round(newAvg * 10) / 10, // Round to 1 decimal
                count: newCount
            };
            await ratedUser.save();
        }

        return res.json({ message: 'Feedback submitted successfully', feedback });
    } catch (err) {
        console.error('Error submitting feedback:', err);
        return res.status(500).json({ message: 'Error submitting feedback', error: err.message });
    }
});

// Get feedbacks for a user
app.get('/feedbacks/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { ratedUser } = req.query;

        let query = {};
        if (ratedUser === 'true') {
            query.ratedUserId = userId;
        } else {
            query.userId = userId;
        }

        const feedbacks = await FeedbackModel.find(query).sort({ createdAt: -1 });
        return res.json(feedbacks);
    } catch (err) {
        console.error('Error fetching feedbacks:', err);
        return res.status(500).json({ message: 'Error fetching feedbacks', error: err.message });
    }
});

// Get all feedbacks (for viewing all feedbacks)
app.get('/feedbacks/all', async (req, res) => {
    try {
        const feedbacks = await FeedbackModel.find({}).sort({ createdAt: -1 });
        return res.json(feedbacks);
    } catch (err) {
        console.error('Error fetching all feedbacks:', err);
        return res.status(500).json({ message: 'Error fetching feedbacks', error: err.message });
    }
});

// Get notifications for a user
app.get('/notifications/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { unreadOnly } = req.query;

        let query = { userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await NotificationModel.find(query)
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 notifications

        return res.json(notifications);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ message: 'Error fetching notifications', error: err.message });
    }
});

// Mark notification as read
app.post('/notifications/:notificationId/mark-read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        const notification = await NotificationModel.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.json({ message: 'Notification marked as read', notification });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        return res.status(500).json({ message: 'Error updating notification', error: err.message });
    }
});

// Mark all notifications as read for a user
app.post('/notifications/:userId/mark-all-read', async (req, res) => {
    try {
        const { userId } = req.params;
        
        await NotificationModel.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        return res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Error marking all notifications as read:', err);
        return res.status(500).json({ message: 'Error updating notifications', error: err.message });
    }
});

// Get user profile
app.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await UserModel.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ message: 'Error fetching user', error: err.message });
    }
});

// Update user profile
app.post('/users/:userId/update', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, phone, address, city, skills } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (city) user.city = city;
        if (skills && user.role === 'volunteer') user.skills = skills;

        await user.save();

        return res.json({ 
            message: 'Profile updated successfully', 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                city: user.city,
                role: user.role,
                skills: user.skills
            }
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ message: 'Error updating profile', error: err.message });
    }
});

// Get available volunteers by location and skills
app.get('/volunteers/available', async (req, res) => {
    try {
        const { city, category } = req.query;
        
        let query = { 
            role: 'volunteer',
            isAvailable: true 
        };
        
        if (city) {
            query.city = city;
        }
        
        if (category) {
            query.skills = category;
        }

        const volunteers = await UserModel.find(query).select('-password');
        return res.json(volunteers);
    } catch (err) {
        console.error('Error fetching volunteers:', err);
        return res.status(500).json({ message: 'Error fetching volunteers', error: err.message });
    }
});

// Find best matched volunteers for a help request based on location and skills
app.get('/volunteers/best-match', async (req, res) => {
    try {
        const { latitude, longitude, category, city, maxDistance } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Location coordinates are required' });
        }

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const maxDist = maxDistance ? parseFloat(maxDistance) : 50; // Default 50 km radius

        let query = { 
            role: 'volunteer',
            isAvailable: true 
        };
        
        if (city) {
            query.city = city;
        }
        
        if (category) {
            query.skills = category;
        }

        // Get all available volunteers
        const volunteers = await UserModel.find(query).select('-password');
        
        // Calculate distance for each volunteer and add to result
        const volunteersWithDistance = volunteers
            .map(volunteer => {
                if (volunteer.location && volunteer.location.latitude && volunteer.location.longitude) {
                    const distance = calculateDistance(
                        lat, 
                        lon, 
                        volunteer.location.latitude, 
                        volunteer.location.longitude
                    );
                    return {
                        ...volunteer.toObject(),
                        distance: parseFloat(distance.toFixed(2))
                    };
                }
                return {
                    ...volunteer.toObject(),
                    distance: null
                };
            })
            .filter(v => v.distance === null || v.distance <= maxDist)
            .sort((a, b) => {
                // Sort by distance (volunteers without location go to end)
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
            });

        return res.json(volunteersWithDistance);
    } catch (err) {
        console.error('Error finding best match volunteers:', err);
        return res.status(500).json({ message: 'Error finding volunteers', error: err.message });
    }
});

// Get statistics for dashboard
app.get('/statistics', async (req, res) => {
    try {
        const { userId, role } = req.query;

        if (role === 'requester') {
            const myRequests = await HelpRequestModel.countDocuments({ requesterEmail: req.query.email });
            const completed = await HelpRequestModel.countDocuments({ 
                requesterEmail: req.query.email, 
                status: 'completed' 
            });
            const pending = await HelpRequestModel.countDocuments({ 
                requesterEmail: req.query.email, 
                status: { $in: ['open', 'accepted', 'in-progress'] }
            });

            return res.json({
                totalRequests: myRequests,
                completed,
                pending
            });
        } else if (role === 'volunteer') {
            const accepted = await HelpRequestModel.countDocuments({ 
                'assignedVolunteer.volunteerId': userId 
            });
            const completed = await HelpRequestModel.countDocuments({ 
                'assignedVolunteer.volunteerId': userId,
                status: 'completed'
            });
            const inProgress = await HelpRequestModel.countDocuments({ 
                'assignedVolunteer.volunteerId': userId,
                status: { $in: ['accepted', 'in-progress'] }
            });

            const volunteer = await UserModel.findById(userId);

            return res.json({
                totalAccepted: accepted,
                completed,
                inProgress,
                rating: volunteer?.rating || { average: 0, count: 0 }
            });
        }

        return res.json({});
    } catch (err) {
        console.error('Error fetching statistics:', err);
        return res.status(500).json({ message: 'Error fetching statistics', error: err.message });
    }
});

// Comprehensive analytics endpoint for admin reports
app.get('/analytics/reports', async (req, res) => {
    try {
        const { range } = req.query;
        
        // Calculate date filter based on range
        let dateFilter = {};
        const now = new Date();
        
        if (range === 'today') {
            dateFilter = {
                createdAt: {
                    $gte: new Date(now.setHours(0, 0, 0, 0))
                }
            };
        } else if (range === 'week') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            dateFilter = { createdAt: { $gte: weekAgo } };
        } else if (range === 'month') {
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            dateFilter = { createdAt: { $gte: monthAgo } };
        } else if (range === 'year') {
            const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
            dateFilter = { createdAt: { $gte: yearAgo } };
        }

        // Get all help requests with date filter
        const allRequests = await HelpRequestModel.find(dateFilter);
        const totalRequests = allRequests.length;
        const completedRequests = allRequests.filter(r => r.status === 'completed').length;
        const activeRequests = allRequests.filter(r => ['accepted', 'in-progress'].includes(r.status)).length;

        // Get volunteer statistics
        const allVolunteers = await UserModel.find({ role: 'volunteer' });
        const totalVolunteers = allVolunteers.length;
        const activeVolunteers = allVolunteers.filter(v => v.isAvailable).length;

        // Get requester count
        const totalRequesters = await UserModel.countDocuments({ role: 'requester' });

        // Status breakdown
        const statusBreakdown = await HelpRequestModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $project: { status: '$_id', count: 1, _id: 0 } }
        ]);

        // Category breakdown
        const categoryBreakdown = await HelpRequestModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $project: { category: '$_id', count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);

        // Urgency breakdown
        const urgencyBreakdown = await HelpRequestModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$urgency', count: { $sum: 1 } } },
            { $project: { urgency: '$_id', count: 1, _id: 0 } }
        ]);

        // City distribution
        const cityBreakdown = await HelpRequestModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$requesterCity', count: { $sum: 1 } } },
            { $project: { city: '$_id', count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);

        // Top volunteers with completed request count
        const topVolunteers = await HelpRequestModel.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            { $group: { 
                _id: '$assignedVolunteer.volunteerId',
                completedCount: { $sum: 1 },
                volunteerEmail: { $first: '$assignedVolunteer.volunteerEmail' }
            } },
            { $sort: { completedCount: -1 } },
            { $limit: 10 }
        ]);

        // Enrich top volunteers with user data
        const enrichedTopVolunteers = await Promise.all(
            topVolunteers.map(async (vol) => {
                const user = await UserModel.findById(vol._id).select('name city rating');
                return {
                    _id: vol._id,
                    name: user?.name || 'Unknown',
                    city: user?.city || 'Unknown',
                    completedCount: vol.completedCount,
                    rating: user?.rating || { average: 0, count: 0 }
                };
            })
        );

        // Recent activity (last 10 requests)
        const recentActivity = await HelpRequestModel.find(dateFilter)
            .sort({ createdAt: -1 })
            .limit(10)
            .select('title requesterName city status createdAt');

        // Calculate average response time (time from creation to acceptance)
        const acceptedRequests = allRequests.filter(r => r.assignedVolunteer?.acceptedAt);
        let averageResponseTime = 'N/A';
        
        if (acceptedRequests.length > 0) {
            const totalResponseTime = acceptedRequests.reduce((sum, req) => {
                const responseTime = new Date(req.assignedVolunteer.acceptedAt) - new Date(req.createdAt);
                return sum + responseTime;
            }, 0);
            const avgMilliseconds = totalResponseTime / acceptedRequests.length;
            const hours = Math.floor(avgMilliseconds / (1000 * 60 * 60));
            averageResponseTime = hours < 1 ? '< 1 hour' : `${hours} hours`;
        }

        return res.json({
            totalRequests,
            completedRequests,
            activeRequests,
            totalVolunteers,
            activeVolunteers,
            totalRequesters,
            statusBreakdown,
            categoryBreakdown,
            urgencyBreakdown,
            cityBreakdown,
            topVolunteers: enrichedTopVolunteers,
            recentActivity,
            averageResponseTime
        });
    } catch (err) {
        console.error('Error fetching analytics:', err);
        return res.status(500).json({ message: 'Error fetching analytics', error: err.message });
    }
});

app.listen(3000, () => {
    console.log("Local Support App server is running on port 3000");
});
