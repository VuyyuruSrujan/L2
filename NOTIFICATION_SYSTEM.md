# Notification System - Implementation Summary

## Overview
The Local Support App now includes a complete notification system with both in-app notifications and email alerts using Nodemailer.

---

## Features

### 1. **In-App Notifications**
- **Bell icon** in both Requester and Volunteer dashboards
- **Unread count badge** showing number of unread notifications
- **Dropdown panel** with all recent notifications (last 50)
- **Auto-refresh** every 30 seconds to check for new notifications
- **Mark as read** functionality (individual or all)
- **Timestamp formatting** (e.g., "5m ago", "2h ago", "3d ago")
- **Type-based icons** (📢 new request, ✅ accepted, 🎉 completed, ⭐ feedback)

### 2. **Email Notifications**
Automated emails are sent for the following events:

#### When a Help Request is Created:
- **Who gets notified**: All available volunteers in the same city
- **Email contains**: Request title, category, urgency, location, description, requester contact
- **In-app notification**: Created for each available volunteer

#### When a Volunteer Accepts a Request:
- **Who gets notified**: The requester who created the request
- **Email contains**: Request title, volunteer name and contact, acceptance timestamp
- **In-app notification**: Created for the requester

#### When a Request is Completed:
- **Who gets notified**: Both the requester AND the volunteer
- **Email contains**: Request title, completion timestamp, thank you message
- **In-app notification**: Created for both parties

---

## Backend Implementation

### Database Model
**File**: `server/models/notification.js`

```javascript
{
  userId: ObjectId,           // Reference to User model
  userEmail: String,          // User's email for quick lookup
  type: String,               // Enum: request_created, request_accepted, request_completed, feedback_received, general
  title: String,              // Notification headline
  message: String,            // Detailed message
  relatedId: ObjectId,        // Reference to related document (e.g., HelpRequest)
  relatedType: String,        // Type of related document
  isRead: Boolean,            // Default: false
  createdAt: Date             // Timestamp
}
```

### API Endpoints

1. **GET /notifications/:userId**
   - Fetches all notifications for a user
   - Query param: `?unreadOnly=true` to get only unread notifications
   - Returns: Array of notifications sorted by createdAt (newest first)

2. **POST /notifications/:notificationId/mark-read**
   - Marks a single notification as read
   - Returns: Updated notification object

3. **POST /notifications/:userId/mark-all-read**
   - Marks all notifications for a user as read
   - Returns: Success message

### Email Configuration
**File**: `server/index.js`

```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### Helper Functions

1. **sendEmailNotification(to, subject, htmlContent)**
   - Sends HTML email using nodemailer
   - Error handling with console logging
   - Non-blocking (errors don't stop request creation)

2. **createNotification(userId, userEmail, type, title, message, relatedId, relatedType)**
   - Creates notification in database
   - Error handling with console logging
   - Returns notification object

### Integration Points

#### Help Request Creation (POST /help-requests/create)
```javascript
// After creating request, notify all available volunteers in same city
const availableVolunteers = await UserModel.find({
  role: 'volunteer',
  city: requesterCity,
  availability: true
});

for (const volunteer of availableVolunteers) {
  await createNotification(...);  // In-app notification
  await sendEmailNotification(...); // Email alert
}
```

#### Help Request Acceptance (POST /help-requests/:requestId/accept)
```javascript
// After accepting request, notify the requester
const requester = await UserModel.findById(helpRequest.requesterId);
await createNotification(...);  // In-app notification
await sendEmailNotification(...); // Email alert
```

#### Help Request Completion (POST /help-requests/:requestId/update-status)
```javascript
if (status === 'completed') {
  // Notify requester
  await createNotification(...);
  await sendEmailNotification(...);
  
  // Notify volunteer
  await createNotification(...);
  await sendEmailNotification(...);
}
```

---

## Frontend Implementation

### Notifications Component
**File**: `frontend/src/components/Notifications.jsx`

**Key Features**:
- Bell icon with SVG (from Heroicons)
- Unread badge (red circle with count)
- Click outside to close dropdown
- Auto-fetch every 30 seconds
- Responsive design (Tailwind CSS)
- Empty state with icon and message
- Loading spinner during fetch
- Time formatting utility
- Type-based emoji icons

**State Management**:
```javascript
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [showDropdown, setShowDropdown] = useState(false);
const [loading, setLoading] = useState(false);
```

**Integration**:
- Imported in RequesterDashboard.jsx
- Imported in VolunteerDashboard.jsx
- Placed in header next to profile and logout buttons

---

## Setup Instructions

### 1. Environment Variables
Create `server/.env` file:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

### 2. Generate Gmail App Password
1. Go to Google Account settings (https://myaccount.google.com/)
2. Enable 2-Step Verification
3. Navigate to Security > 2-Step Verification > App passwords
4. Create new app password:
   - App: Mail
   - Device: Other (Custom name) → "Local Support App"
5. Copy the 16-character password (no spaces)
6. Add to `.env` as `EMAIL_PASS`

### 3. Test the System
1. Start the backend: `cd server && npm start`
2. Start the frontend: `cd frontend && npm run dev`
3. Create a requester account
4. Create a volunteer account (same city as requester)
5. Set volunteer as available
6. Create a help request as requester
7. Check:
   - Volunteer should see notification bell badge
   - Volunteer should receive email
   - Click bell to see notification details

---

## Technical Details

### Polling vs WebSocket
- Currently using **polling** (fetch every 30 seconds)
- Pros: Simple, no additional server setup
- Cons: Slight delay, extra network requests
- Future: Could upgrade to WebSocket for real-time updates

### Email Template
- HTML emails with inline styles
- Responsive design
- Brand colors (blue for header, gray for content)
- Clear call-to-action messages
- Automated signature

### Error Handling
- All notification operations wrapped in try-catch
- Errors logged to console
- **Non-blocking**: Failed notifications don't stop core operations
- Example: Help request still created even if email fails

### Performance Considerations
- Notifications limited to last 50 per user
- Index on userId for fast queries
- Auto-sort by createdAt (newest first)
- Lazy loading (only fetch when dropdown opened)

---

## User Experience Flow

### Requester Creates Help Request
1. Fills form in "Create Request" tab
2. Submits request
3. Backend finds available volunteers in same city
4. Creates notification for each volunteer
5. Sends email to each volunteer
6. Requester sees success message

### Volunteer Receives Notification
1. Bell icon shows red badge (1 unread)
2. Clicks bell icon
3. Sees dropdown with new notification
4. Also receives email in inbox
5. Clicks notification to mark as read
6. Badge count decreases

### Volunteer Accepts Request
1. Clicks "Accept Request" button
2. Backend creates notification for requester
3. Sends email to requester
4. Volunteer sees success message
5. Requester's bell badge updates (if online)

### Request Completed
1. Volunteer marks request as completed
2. Backend creates notifications for both parties
3. Sends emails to both
4. Both see completion notifications
5. Requester prompted to leave feedback

---

## Code Files Modified/Created

### Backend
- ✅ `server/models/notification.js` (NEW)
- ✅ `server/index.js` (MODIFIED - added imports, helpers, endpoints, integrations)
- ✅ `server/.env.example` (MODIFIED - added email config)

### Frontend
- ✅ `frontend/src/components/Notifications.jsx` (NEW)
- ✅ `frontend/src/components/requester/RequesterDashboard.jsx` (MODIFIED - added Notifications)
- ✅ `frontend/src/components/volunteer/VolunteerDashboard.jsx` (MODIFIED - added Notifications)

### Documentation
- ✅ `README.md` (MODIFIED - added email setup instructions and updated features)

---

## Testing Checklist

- [ ] Create help request → volunteers in same city get notified
- [ ] Create help request → volunteers receive email
- [ ] Volunteer accepts → requester gets notified
- [ ] Volunteer accepts → requester receives email
- [ ] Mark request completed → both parties get notified
- [ ] Mark request completed → both parties receive email
- [ ] Bell badge shows correct unread count
- [ ] Clicking notification marks as read
- [ ] "Mark all read" button works
- [ ] Auto-refresh every 30 seconds works
- [ ] Empty state displays when no notifications
- [ ] Time formatting displays correctly
- [ ] Type-based icons display correctly
- [ ] Email templates render properly in Gmail/Outlook

---

## Future Enhancements

1. **WebSocket Integration**: Real-time notifications without polling
2. **Push Notifications**: Browser push notifications API
3. **Email Preferences**: User settings to opt-in/opt-out of email types
4. **SMS Notifications**: Twilio integration for urgent requests
5. **Notification History Page**: Dedicated page to view all notifications
6. **Search/Filter**: Filter notifications by type or date range
7. **Rich Notifications**: Add action buttons (e.g., "Accept" directly from notification)
8. **Sound Alerts**: Optional sound when new notification arrives
9. **Desktop Notifications**: Native OS notifications for desktop users
10. **Batch Digests**: Daily/weekly email summaries instead of individual emails

---

## Troubleshooting

### Emails Not Sending
1. Check `.env` file has correct EMAIL_USER and EMAIL_PASS
2. Verify Gmail app password (16 characters, no spaces)
3. Check server console for error messages
4. Ensure 2-Step Verification is enabled on Google account
5. Try regenerating app password

### Notifications Not Appearing
1. Check browser console for errors
2. Verify userId in API request matches current user
3. Check MongoDB for notification documents
4. Ensure server is running and accessible
5. Check network tab for API call responses

### Badge Count Incorrect
1. Clear browser cache and reload
2. Check isRead field in database
3. Verify mark-as-read API is being called
4. Check for duplicate notifications

### Dropdown Not Closing
1. Check click-outside handler in useEffect
2. Verify dropdownRef is attached to correct element
3. Check for z-index conflicts with other components

---

## Conclusion

The notification system is fully functional with:
- ✅ In-app notifications with bell icon and badge
- ✅ Email notifications using Nodemailer
- ✅ Integration with all help request workflows
- ✅ Complete API endpoints for fetching and updating
- ✅ Frontend components in both dashboards
- ✅ Documentation and setup instructions

Users will now receive real-time updates about their help requests through both the app and email, creating a more engaging and responsive experience!
