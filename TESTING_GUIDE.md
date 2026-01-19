# Quick Test Guide for New Features

## 🚀 Setup & Start

```bash
# Terminal 1 - Start Backend
cd server
npm start

# Terminal 2 - Start Frontend
cd frontend
npm run dev
```

Access at: http://localhost:5173

---

## 🧪 Testing Location Tracking Feature

### Step 1: Create a Requester Account
1. Go to Register → Select "Requester"
2. Fill in details (use City: "Mumbai" for testing)
3. Login with credentials

### Step 2: Create a Help Request
1. Go to "Create Request" tab
2. Fill in:
   - Title: "Need grocery shopping help"
   - Description: "Can someone help me with groceries?"
   - Category: "grocery"
   - Urgency: "medium"
3. Click "Get Current Location" (grant browser permission)
4. Submit Request

### Step 3: Create a Volunteer Account
1. Logout and Register → Select "Volunteer"
2. Fill in details:
   - Use same City: "Mumbai"
   - Add skills: ["grocery", "transportation"]
3. Enable location when prompted
4. Login

### Step 4: Accept Request
1. In Volunteer Dashboard → "Available Requests" tab
2. See the request you created
3. Click "Accept Request"

### Step 5: Test Location Tracking
1. Go to "My Accepted Requests" tab
2. Click "Start Help" → Status becomes "in-progress"
3. Click "Start Location Sharing" button
4. See green pulsing indicator → You're now sharing location!

### Step 6: View Location as Requester
1. Login as the requester (different browser/incognito)
2. Go to "My Help Requests" tab
3. See the accepted request with volunteer info
4. See "Live Location" section with volunteer's coordinates
5. Click "View on Google Maps" to see on map
6. Location updates automatically every 10 seconds

---

## 📊 Testing Admin Analytics Dashboard

### Step 1: Create Admin User (Manually in Database)
```javascript
// In MongoDB Compass or mongo shell
db.users.insertOne({
  name: "Admin User",
  email: "admin@test.com",
  password: "admin123",
  phone: "1234567890",
  address: "Admin Office",
  city: "Mumbai",
  role: "admin",
  createdAt: new Date()
})
```

### Step 2: Login as Admin
1. Login with admin@test.com / admin123
2. You'll be redirected to Admin Dashboard

### Step 3: View Analytics
1. Click on "Analytics" tab
2. You'll see:
   - **Overview Cards:** Total requests, completed, active, volunteers
   - **Status Distribution:** Visual breakdown with progress bars
   - **Category Breakdown:** Which services are most requested
   - **Urgency Levels:** How urgent are requests
   - **Top Cities:** Geographic distribution
   - **Top Volunteers:** Leaderboard with medals (🥇🥈🥉)
   - **Recent Activity:** Last 10 requests
   - **System Summary:** Overall statistics

### Step 4: Test Time Filters
1. Change time period dropdown:
   - Today
   - This Week
   - This Month
   - This Year
   - All Time
2. Watch charts update automatically

---

## 🔍 Testing Volunteer Distance Matching

### Setup:
You need volunteers in different locations for this test.

### Step 1: Create Multiple Volunteers
Create 3 volunteer accounts with different locations:

**Volunteer 1 (Close):**
- City: Mumbai
- Location: Enable and set close to requester

**Volunteer 2 (Medium Distance):**
- City: Mumbai
- Location: Different area

**Volunteer 3 (Far):**
- City: Pune
- Location: Different city

### Step 2: Test Best Match API
Use this endpoint to see distance-sorted volunteers:

```bash
# Replace with actual coordinates from your requester
curl "http://localhost:3000/volunteers/best-match?latitude=19.0760&longitude=72.8777&maxDistance=50"
```

Expected Response:
```json
[
  {
    "name": "Volunteer 1",
    "city": "Mumbai",
    "distance": 2.5,  // Closest
    "isAvailable": true
  },
  {
    "name": "Volunteer 2",
    "city": "Mumbai",
    "distance": 15.8,  // Medium
    "isAvailable": true
  }
  // Volunteer 3 won't appear if > 50km away
]
```

---

## 📱 Browser Permissions

### If Location Not Working:

**Chrome:**
1. Click lock icon in address bar
2. Site Settings → Location → Allow

**Firefox:**
1. Click "i" icon in address bar
2. Permissions → Location → Allow

**Edge:**
1. Click lock icon
2. Permissions for this site → Location → Allow

---

## 🐛 Common Issues & Solutions

### Issue 1: Location Not Updating
**Solution:**
- Refresh the page
- Check browser console for errors
- Ensure HTTPS or localhost (geolocation requires secure context)
- Grant location permissions

### Issue 2: Analytics Shows No Data
**Solution:**
- Create some test requests first
- Complete at least 1-2 requests
- Try different time period filters
- Check MongoDB connection

### Issue 3: Distance Calculation Shows "null"
**Solution:**
- Ensure volunteers have location set (call update-location API)
- Check that location has both latitude and longitude
- Verify coordinates are valid numbers

### Issue 4: Google Maps Link Not Working
**Solution:**
- Ensure location is being updated
- Check that currentLocation exists in help request
- Try copy-pasting coordinates directly into Google Maps

---

## 📋 Test Data Examples

### Good Test Coordinates (Mumbai, India)
```javascript
Requester Location:
latitude: 19.0760
longitude: 72.8777

Volunteer 1 (Close - 2km away):
latitude: 19.0900
longitude: 72.8800

Volunteer 2 (Medium - 15km away):
latitude: 19.2000
longitude: 72.9000

Volunteer 3 (Far - 50km away):
latitude: 19.5000
longitude: 73.0000
```

### Sample Help Request
```json
{
  "title": "Need help with grocery shopping",
  "description": "I am elderly and need someone to help me buy groceries from the local market. Should take about 1-2 hours.",
  "category": "grocery",
  "urgency": "medium",
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "address": "Andheri West, Mumbai"
  }
}
```

---

## ✅ Feature Checklist

Test each feature and check off:

### Location Tracking
- [ ] Volunteer can start location sharing
- [ ] Location updates automatically (green pulsing indicator)
- [ ] Requester sees volunteer's live location
- [ ] Location refreshes every 10 seconds
- [ ] "View on Google Maps" opens correct location
- [ ] Tracking stops when request completed

### Distance Matching
- [ ] Volunteers sorted by distance (nearest first)
- [ ] Distance shown in kilometers
- [ ] Volunteers beyond maxDistance filtered out
- [ ] City filter works
- [ ] Category/skills filter works

### Admin Analytics
- [ ] All stat cards show correct numbers
- [ ] Progress bars display percentages
- [ ] Time filter changes data
- [ ] Top volunteers leaderboard shows rankings
- [ ] Recent activity shows last 10 requests
- [ ] Charts are color-coded correctly

---

## 🎯 Expected Results

### After Creating 5 Test Requests:
- 2 completed
- 1 in-progress (with live tracking)
- 1 accepted
- 1 open

### Admin Analytics Should Show:
- Total Requests: 5
- Completed: 2 (40% completion rate)
- Active: 2 (accepted + in-progress)
- Status breakdown with percentages
- Category distribution
- Top volunteer with 2 completions at #1

---

## 📸 Screenshots to Verify

Take screenshots of:
1. ✅ Volunteer dashboard showing "Start Location Sharing" button
2. ✅ Green pulsing indicator when tracking is active
3. ✅ Requester dashboard showing volunteer's live location
4. ✅ Google Maps with volunteer's location
5. ✅ Admin analytics dashboard with all charts
6. ✅ Top volunteers leaderboard with medals
7. ✅ Nearby volunteers component with distance in km

---

## 🚨 Emergency Reset

If something breaks:

```bash
# Stop all servers
Ctrl + C in both terminals

# Clear MongoDB data (if needed)
mongo
use local_support_app
db.help_requests.deleteMany({})
db.users.deleteMany({role: {$ne: 'admin'}})

# Restart servers
cd server && npm start
cd frontend && npm run dev
```

---

## 📞 Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check server terminal for backend errors
3. Verify MongoDB is running: `mongod`
4. Ensure all dependencies installed: `npm install`
5. Check [FEATURES_IMPLEMENTATION.md](FEATURES_IMPLEMENTATION.md) for API details

Happy Testing! 🎉
