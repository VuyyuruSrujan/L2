# Local Support App - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js and npm installed
- MongoDB running on `localhost:27017`
- Database name: `local_support_app`

### Installation

#### Backend Setup
```bash
cd server
npm install
npm start  # Runs on port 3000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Runs on port 5173
```

---

## 👥 User Roles

### 1. Requester (Person Needing Help)
- **Register as**: Person who needs assistance
- **Can do**:
  - Create help requests with location
  - View status of requests
  - See volunteer details when request is accepted
  - Rate volunteers after service completion
- **Dashboard**: `/requester/dashboard`

### 2. Volunteer (Person Offering Help)
- **Register as**: Person willing to help
- **Can do**:
  - Browse available help requests
  - Filter by category and location
  - Accept help requests
  - Track accepted requests
  - Share location while helping
  - Update request status
  - Build reputation through ratings
- **Dashboard**: `/volunteer/dashboard`

---

## 🔄 Help Request Workflow

### Step 1: Requester Creates Request
1. Login/Register as **Requester**
2. Go to "Create Request" tab
3. Fill in:
   - Title (brief description)
   - Description (detailed info)
   - Category (medical, transportation, grocery, technical, companionship, emergency, other)
   - Urgency (low, medium, high, urgent)
   - Location (auto-capture via GPS or manual coordinates)
4. Submit request
5. Request status becomes **OPEN**

### Step 2: Volunteer Finds Request
1. Login/Register as **Volunteer** (select skills during registration)
2. Go to "Available Requests" tab
3. Browse requests, filter by:
   - Category
   - City
4. Click "Accept Request"
5. Request status becomes **ACCEPTED**

### Step 3: Volunteer Provides Help
1. Go to "My Accepted Requests"
2. Click "Start Help" to mark as **IN-PROGRESS**
3. Real-time location is shared
4. Click "Mark as Completed" when done
5. Request status becomes **COMPLETED**

### Step 4: Rating & Feedback
1. Both requester and volunteer can rate each other
2. Visit Feedbacks section
3. Submit rating (1-5 stars) and comment
4. Ratings update volunteer/requester profile

---

## 📋 Request Categories

- 🏥 **Medical Assistance** - Health-related help
- 🚗 **Transportation** - Need a ride or help with travel
- 🛒 **Grocery Shopping** - Help buying groceries
- 💻 **Technical Help** - Computer or device help
- 🤝 **Companionship** - Need someone to spend time with
- 🚨 **Emergency** - Urgent help needed
- 📋 **Other** - Any other type of help

---

## ⏰ Urgency Levels

- **Low** - Can wait a few days
- **Medium** - Should be done in 1-2 days
- **High** - Should be done today
- **Urgent** - Need immediate help

---

## 📍 Location Features

### For Requesters
- Click "Get Current Location" to auto-capture GPS coordinates
- Manually enter latitude/longitude if needed
- Add address for clarity

### For Volunteers
- Requests filtered by your city
- Location shared in real-time during help delivery
- Distance-based matching (future feature)

---

## ⭐ Rating System

### Volunteer Rating by Requester
- Rate on scale of 1-5 stars
- Affects volunteer's profile rating
- Comments help build trust

### Requester Feedback by Volunteer
- Can rate requester's behavior/cooperation
- Helps other volunteers assess requests

### Viewing Ratings
- Check user profile for average rating
- See number of completed services
- Read individual feedback comments

---

## 📊 Dashboard Statistics

### Requester Dashboard Shows:
- Total help requests submitted
- Completed requests
- Pending requests (open/accepted/in-progress)

### Volunteer Dashboard Shows:
- Total requests accepted
- Completed requests
- Currently in-progress requests
- Your average rating
- Number of ratings received

---

## 🔐 Account Management

### Profile Update
- Update name, phone, address, city
- Volunteers can add/remove skills
- Change password (coming soon)

### Availability
- Volunteers can toggle availability
- Unavailable status hides from open requests
- Useful when busy or on vacation

---

## 🚨 Important Notes

### For Requesters
1. ✅ Provide clear, detailed descriptions
2. ✅ Update location accuracy for better matches
3. ✅ Rate volunteers to help the community
4. ✅ Follow up if help is not needed
5. ❌ Don't cancel requests without good reason

### For Volunteers
1. ✅ Select accurate skills during registration
2. ✅ Keep availability status updated
3. ✅ Share location when helping
4. ✅ Update request status as you progress
5. ✅ Build your reputation with good ratings
6. ❌ Don't abandon accepted requests

---

## 🆘 Troubleshooting

### Can't Login
- Check email and password are correct
- Make sure account is registered
- Check if account has been blocked by system

### Request Not Showing
- Make sure your city matches volunteer's city
- Check request isn't already accepted
- Verify you're filtering with correct category

### Location Not Capturing
- Allow location permission in browser
- Check GPS is enabled on device
- Try entering coordinates manually

### Can't Accept Request
- Check your account is verified as volunteer
- Make sure you're not already assigned to another request
- Verify your availability is turned ON

---

## 📞 Contact & Support

For issues or feature requests, contact the development team.

---

## 📚 API Documentation

All endpoints are documented in `IMPLEMENTATION_SUMMARY.md`

Key endpoints:
- `POST /register` - Create new account
- `POST /login` - Login
- `POST /help-requests/create` - Create help request
- `GET /help-requests/open` - View available requests
- `POST /help-requests/:id/accept` - Accept request
- `POST /feedbacks/create` - Submit feedback
- `GET /statistics` - Get dashboard stats

---

**Last Updated**: January 2, 2026
**App Version**: 1.0.0
**Database**: local_support_app
