const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
require('dotenv').config();

const UserModel = require('./models/customer_reg');
const HelpRequestModel = require('./models/helpRequest');
const FeedbackModel = require('./models/feedback');
const NotificationModel = require('./models/notification');
const MessageModel = require('./models/message');

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

// Helper to create a Google Meet style link (letters only, format: abc-defg-hij)
function generateMeetLink() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const segment = (len) => Array.from({ length: len }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
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

// Get all help requests (Admin view)
app.get('/admin/help-requests/all', async (req, res) => {
    try {
        const requests = await HelpRequestModel.find()
            .sort({ urgency: -1, createdAt: -1 });

        return res.json(requests);
    } catch (err) {
        console.error('Error fetching all help requests:', err);
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

        // Generate a valid-format Meet link (stable per request)
        const meetLink = helpRequest.meetLink || generateMeetLink();

        helpRequest.status = 'accepted';
        helpRequest.assignedVolunteer = {
            volunteerId: volunteer._id,
            volunteerEmail,
            volunteerName,
            volunteerPhone,
            acceptedAt: new Date()
        };
        helpRequest.meetLink = meetLink;
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

        // Validate ObjectId to avoid cast errors
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        let query = { userId: new mongoose.Types.ObjectId(userId) };
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

// ============================================
// CHAT / MESSAGING ENDPOINTS
// ============================================

// Send a message
app.post('/api/messages/send', async (req, res) => {
    try {
        const { senderId, senderModel, receiverId, receiverModel, message, helpRequestId } = req.body;

        if (!senderId || !senderModel || !receiverId || !receiverModel || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newMessage = await MessageModel.create({
            senderId,
            senderModel,
            receiverId,
            receiverModel,
            message,
            helpRequestId
        });

        // Populate sender and receiver info
        const populatedMessage = await MessageModel.findById(newMessage._id)
            .populate('senderId', 'name email')
            .populate('receiverId', 'name email');

        res.status(201).json(populatedMessage);
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ message: 'Error sending message', error: err.message });
    }
});

// Get conversation between two users
app.get('/api/messages/conversation/:userId1/:userId2', async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;
        const { limit = 50, helpRequestId } = req.query;

        const query = {
            $or: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 }
            ]
        };

        // Filter by helpRequestId if provided
        if (helpRequestId) {
            query.helpRequestId = helpRequestId;
        }

        const messages = await MessageModel.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('senderId', 'name email')
        .populate('receiverId', 'name email');

        // Mark messages as read where current user is receiver
        await MessageModel.updateMany(
            { receiverId: userId1, senderId: userId2, isRead: false },
            { isRead: true }
        );

        res.json(messages.reverse());
    } catch (err) {
        console.error('Error fetching conversation:', err);
        res.status(500).json({ message: 'Error fetching conversation', error: err.message });
    }
});

// Get all conversations for a user
app.get('/api/messages/chats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get all unique users this user has chatted with
        const sentMessages = await MessageModel.distinct('receiverId', { senderId: userId });
        const receivedMessages = await MessageModel.distinct('senderId', { receiverId: userId });
        
        const uniqueUserIds = [...new Set([...sentMessages.map(id => id.toString()), ...receivedMessages.map(id => id.toString())])];

        // Get last message with each user and unread count
        const chats = await Promise.all(uniqueUserIds.map(async (otherUserId) => {
            const lastMessage = await MessageModel.findOne({
                $or: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            })
            .sort({ createdAt: -1 })
            .populate('senderId', 'name email role')
            .populate('receiverId', 'name email role');

            const unreadCount = await MessageModel.countDocuments({
                senderId: otherUserId,
                receiverId: userId,
                isRead: false
            });

            // Get the other user's info
            const otherUser = await UserModel.findById(otherUserId).select('name email role');

            return {
                userId: otherUserId,
                user: otherUser,
                lastMessage,
                unreadCount
            };
        }));

        // Sort by last message time
        chats.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

        res.json(chats);
    } catch (err) {
        console.error('Error fetching chats:', err);
        res.status(500).json({ message: 'Error fetching chats', error: err.message });
    }
});

// Get unread message count for a user
app.get('/api/messages/unread/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const unreadCount = await MessageModel.countDocuments({
            receiverId: userId,
            isRead: false
        });
        res.json({ unreadCount });
    } catch (err) {
        console.error('Error fetching unread count:', err);
        res.status(500).json({ message: 'Error fetching unread count', error: err.message });
    }
});

// Mark messages as read
app.put('/api/messages/mark-read', async (req, res) => {
    try {
        const { receiverId, senderId } = req.body;
        await MessageModel.updateMany(
            { receiverId, senderId, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'Messages marked as read' });
    } catch (err) {
        console.error('Error marking messages as read:', err);
        res.status(500).json({ message: 'Error marking messages as read', error: err.message });
    }
});

// ========== ADMIN MANAGEMENT ROUTES ==========

// Get all users (Admin only)
app.get('/admin/users', async (req, res) => {
    try {
        const users = await UserModel.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
});

// Get users by role (Admin only)
app.get('/admin/users/role/:role', async (req, res) => {
    try {
        const { role } = req.params;
        const validRoles = ['requester', 'volunteer', 'admin', 'technician'];
        
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        
        const users = await UserModel.find({ role }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users by role:', err);
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
});

// Create a new user (Admin only)
app.post('/admin/users/create', async (req, res) => {
    try {
        const { name, email, password, phone, address, city, role } = req.body;

        // Validate required fields
        if (!name || !email || !password || !phone || !address || !city || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create new user
        const newUser = await UserModel.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            role,
            isAvailable: true,
            isVerified: role === 'volunteer' ? false : true
        });

        // Send welcome email
        await sendEmailNotification(
            newUser.email,
            'Welcome to Local Support App',
            `<h2>Welcome to Local Support App!</h2>
            <p>Hello ${newUser.name},</p>
            <p>Your account has been created as a ${role}.</p>
            <p>You can now login to the system.</p>
            <p>Best regards,<br>Local Support Team</p>`
        );

        res.status(201).json({ 
            message: 'User created successfully',
            userId: newUser._id
        });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Error creating user', error: err.message });
    }
});

// Update user details (Admin only)
app.put('/admin/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, phone, address, city, role, isAvailable, isVerified } = req.body;

        // Check if user exists
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if new email is already taken by another user
        if (email && email !== user.email) {
            const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Update fields
        if (name) user.name = name.trim();
        if (email) user.email = email.toLowerCase().trim();
        if (phone) user.phone = phone.trim();
        if (address) user.address = address.trim();
        if (city) user.city = city.trim();
        if (role) user.role = role;
        if (isAvailable !== undefined) user.isAvailable = isAvailable;
        if (isVerified !== undefined) user.isVerified = isVerified;

        await user.save();

        res.json({ 
            message: 'User updated successfully',
            user: user.toObject()
        });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Error updating user', error: err.message });
    }
});

// Delete user (Admin only)
app.delete('/admin/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await UserModel.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Error deleting user', error: err.message });
    }
});

// Block/Unblock user (Admin only)
app.put('/admin/users/:userId/block-status', async (req, res) => {
    try {
        const { userId } = req.params;
        const { isBlocked, reason } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.blocked = {
            isBlocked,
            blockedBy: 'admin',
            blockedAt: isBlocked ? new Date() : null,
            reason: isBlocked ? reason : ''
        };

        await user.save();

        res.json({ 
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user: user.toObject()
        });
    } catch (err) {
        console.error('Error updating block status:', err);
        res.status(500).json({ message: 'Error updating block status', error: err.message });
    }
});

// ========== VOLUNTEER MANAGEMENT ROUTES ==========

// Get all volunteers (Admin only)
app.get('/admin/volunteers', async (req, res) => {
    try {
        const volunteers = await UserModel.find({ role: 'volunteer' }).select('-password').sort({ createdAt: -1 });
        res.json(volunteers);
    } catch (err) {
        console.error('Error fetching volunteers:', err);
        res.status(500).json({ message: 'Error fetching volunteers', error: err.message });
    }
});

// Get available volunteers by location and skills (Admin only)
app.post('/admin/volunteers/available', async (req, res) => {
    try {
        const { latitude, longitude, skills = [], maxDistance = 10 } = req.body;

        const volunteers = await UserModel.find({
            role: 'volunteer',
            isAvailable: true,
            isVerified: true,
            'blocked.isBlocked': false
        }).select('-password');

        // Filter by location if provided
        let filtered = volunteers;
        if (latitude && longitude) {
            filtered = volunteers.filter(v => {
                if (!v.location || !v.location.latitude || !v.location.longitude) {
                    return false;
                }
                const distance = calculateDistance(
                    latitude, longitude,
                    v.location.latitude, v.location.longitude
                );
                return distance <= maxDistance;
            });
        }

        // Filter by skills if provided
        if (skills.length > 0) {
            filtered = filtered.filter(v => 
                skills.some(skill => v.skills && v.skills.includes(skill))
            );
        }

        res.json(filtered);
    } catch (err) {
        console.error('Error fetching available volunteers:', err);
        res.status(500).json({ message: 'Error fetching volunteers', error: err.message });
    }
});

// Assign volunteer to a help request (Admin only)
app.post('/admin/assign-volunteer', async (req, res) => {
    try {
        const { requestId, volunteerId, adminEmail, adminName } = req.body;

        if (!requestId || !volunteerId) {
            return res.status(400).json({ message: 'Request ID and Volunteer ID are required' });
        }

        const helpRequest = await HelpRequestModel.findById(requestId);
        if (!helpRequest) {
            return res.status(404).json({ message: 'Help request not found' });
        }

        const volunteer = await UserModel.findById(volunteerId);
        if (!volunteer) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        // Update help request
        helpRequest.assignedVolunteer = {
            volunteerId: volunteer._id,
            volunteerName: volunteer.name,
            volunteerEmail: volunteer.email,
            volunteerPhone: volunteer.phone,
            acceptedAt: new Date()
        };
        helpRequest.status = 'accepted';

        await helpRequest.save();

        // Create notification for volunteer
        await createNotification(
            volunteer._id,
            volunteer.email,
            'assignment',
            'New Request Assignment',
            `You have been assigned to a new help request by ${adminName}`,
            helpRequest._id,
            'helpRequest'
        );

        // Send email to volunteer
        await sendEmailNotification(
            volunteer.email,
            'New Request Assignment',
            `<h2>You have been assigned to a new request!</h2>
            <p>Dear ${volunteer.name},</p>
            <p>You have been assigned to a help request.</p>
            <p>Please check your dashboard for more details.</p>
            <p>Best regards,<br>Local Support Team</p>`
        );

        res.json({ 
            message: 'Volunteer assigned successfully',
            request: helpRequest.toObject()
        });
    } catch (err) {
        console.error('Error assigning volunteer:', err);
        res.status(500).json({ message: 'Error assigning volunteer', error: err.message });
    }
});

// Update volunteer profile/status (Admin only)
app.put('/admin/volunteers/:volunteerId', async (req, res) => {
    try {
        const { volunteerId } = req.params;
        const { skills, isAvailable, isVerified } = req.body;

        const volunteer = await UserModel.findById(volunteerId);
        if (!volunteer) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        if (skills) volunteer.skills = skills;
        if (isAvailable !== undefined) volunteer.isAvailable = isAvailable;
        if (isVerified !== undefined) volunteer.isVerified = isVerified;

        await volunteer.save();

        res.json({ 
            message: 'Volunteer updated successfully',
            volunteer: volunteer.toObject()
        });
    } catch (err) {
        console.error('Error updating volunteer:', err);
        res.status(500).json({ message: 'Error updating volunteer', error: err.message });
    }
});

// ========== MONITORING ROUTES ==========

// Get all ongoing help requests (Admin only)
app.get('/admin/requests/ongoing', async (req, res) => {
    try {
        const requests = await HelpRequestModel.find({
            status: { $in: ['pending', 'assigned', 'in-progress'] }
        }).sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error('Error fetching ongoing requests:', err);
        res.status(500).json({ message: 'Error fetching requests', error: err.message });
    }
});

// Get all complaints with monitoring data (Admin only)
app.get('/admin/complaints/all', async (req, res) => {
    try {
        const ComplaintModel = require('./models/complaint');
        const complaints = await ComplaintModel.find().sort({ createdAt: -1 });

        res.json(complaints);
    } catch (err) {
        console.error('Error fetching complaints:', err);
        res.status(500).json({ message: 'Error fetching complaints', error: err.message });
    }
});

// Get volunteer activity summary (Admin only)
app.get('/admin/volunteers/:volunteerId/activity', async (req, res) => {
    try {
        const { volunteerId } = req.params;

        const volunteer = await UserModel.findById(volunteerId);
        if (!volunteer) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        const completedRequests = await HelpRequestModel.countDocuments({
            'assignedTo.volunteerId': volunteerId,
            status: 'completed'
        });

        const ongoingRequests = await HelpRequestModel.countDocuments({
            'assignedTo.volunteerId': volunteerId,
            status: { $in: ['assigned', 'in-progress'] }
        });

        const feedbackCount = await FeedbackModel.countDocuments({
            volunteerId
        });

        res.json({
            volunteerId,
            volunteerName: volunteer.name,
            rating: volunteer.rating.average,
            ratingCount: volunteer.rating.count,
            completedRequests,
            ongoingRequests,
            feedback: feedbackCount,
            isAvailable: volunteer.isAvailable,
            skills: volunteer.skills
        });
    } catch (err) {
        console.error('Error fetching volunteer activity:', err);
        res.status(500).json({ message: 'Error fetching activity', error: err.message });
    }
});

// Get comprehensive monitoring dashboard data (Admin only)
app.get('/admin/dashboard/metrics', async (req, res) => {
    try {
        const totalUsers = await UserModel.countDocuments();
        const totalVolunteers = await UserModel.countDocuments({ role: 'volunteer' });
        const totalRequesters = await UserModel.countDocuments({ role: 'requester' });
        const totalAdmins = await UserModel.countDocuments({ role: 'admin' });
        
        const ongoingRequests = await HelpRequestModel.countDocuments({
            status: { $in: ['pending', 'assigned', 'in-progress'] }
        });
        
        const completedRequests = await HelpRequestModel.countDocuments({ status: 'completed' });
        
        const ComplaintModel = require('./models/complaint');
        const totalComplaints = await ComplaintModel.countDocuments();
        const openComplaints = await ComplaintModel.countDocuments({ status: 'open' });
        
        const totalFeedback = await FeedbackModel.countDocuments();
        const averageRating = await FeedbackModel.aggregate([
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        res.json({
            users: {
                total: totalUsers,
                volunteers: totalVolunteers,
                requesters: totalRequesters,
                admins: totalAdmins
            },
            requests: {
                ongoing: ongoingRequests,
                completed: completedRequests
            },
            complaints: {
                total: totalComplaints,
                open: openComplaints,
                resolved: totalComplaints - openComplaints
            },
            feedback: {
                total: totalFeedback,
                averageRating: averageRating[0]?.avgRating || 0
            }
        });
    } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        res.status(500).json({ message: 'Error fetching metrics', error: err.message });
    }
});

// Get users for admin (optionally filter by role)
app.get('/admin/users', async (req, res) => {
    try {
        const { role } = req.query;
        const query = role ? { role } : {};
        const users = await UserModel.find(query).select('-password');
        return res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
});

// Update user details (Admin)
app.patch('/admin/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, phone, role, city, address, password } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (city !== undefined) updates.city = city;
        if (address !== undefined) updates.address = address;
        if (role !== undefined) updates.role = role;
        if (password) updates.password = password;

        const user = await UserModel.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ message: 'User updated successfully', user });
    } catch (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ message: 'Error updating user', error: err.message });
    }
});

app.listen(3000, () => {
    console.log("Local Support App server is running on port 3000");
});
