# 🛠️ Local Service Management System

![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=061E26)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-Server-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Test_Mode-635BFF?logo=stripe&logoColor=white)

A full‑stack app to manage local service complaints, assignments, technician workflows, and payments. Includes role‑based dashboards (Customer, Admin, Technician, Super Admin) and Stripe checkout integration.

---

## 🚀 Quick Start

- Prerequisites: Node.js 18+ and npm

```bash
# 1) Install dependencies
cd server && npm install
cd ../frontend && npm install

# 2) Configure environment (server)
# Create server/.env and add your Stripe key
# STRIPE_SECRET_KEY=sk_test_...

# 3) Run the backend (server)
cd ../server
npm start
# → Server runs on http://localhost:3000

# 4) Run the frontend (React)
cd ../frontend
npm run dev
# → Frontend runs on http://localhost:5173
```

---

## 📦 Project Structure

```
final_project/
├─ frontend/            # React + Vite app (UI)
│  ├─ src/
│  │  ├─ components/    # Role‑based views and pages
│  │  ├─ context/       # Auth context
│  │  └─ utils/         # Helpers
│  └─ ...
└─ server/              # Express API + Mongo + Stripe
   ├─ models/           # Mongoose models
   ├─ index.js          # Routes and controllers
   └─ .env              # STRIPE_SECRET_KEY (local only)
```

Key files:
- Frontend scripts: see [frontend/package.json](frontend/package.json)
- Backend entry: see [server/index.js](server/index.js)
- Environment file (local): [server/.env](server/.env)

---

## ⚙️ Environment Variables (Server)

Create a single file at [server/.env](server/.env):

```env
STRIPE_SECRET_KEY=sk_test_your_test_key_here

# Email Configuration for Nodemailer (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

**Setting up Gmail for Email Notifications:**

1. Go to your Google Account settings (https://myaccount.google.com/)
2. Enable 2-Step Verification if not already enabled
3. Navigate to Security > 2-Step Verification > App passwords
4. Create a new app password:
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter "Local Support App" or any name
5. Copy the generated 16-character password (without spaces)
6. Add it to your `.env` file as `EMAIL_PASS`

Notes:
- The server uses `dotenv` to load this value.
- Never commit real secrets. `.env` is ignored by Git.
- Email notifications are sent when:
  - A new help request is created (notifies available volunteers)
  - A volunteer accepts a request (notifies the requester)
  - A request is completed (notifies both requester and volunteer)

---

## 🧩 Install & Run

- Backend (Express):
  - Install: `npm install` in [server](server)
  - Start: `npm start` (uses nodemon)
  - URL: http://localhost:3000

- Frontend (React + Vite):
  - Install: `npm install` in [frontend](frontend)
  - Dev server: `npm run dev`
  - URL: http://localhost:5173

---

## 🧪 Available Scripts

- Frontend (run inside `frontend/`):
  - `npm run dev` — start Vite dev server
  - `npm run build` — build for production
  - `npm run preview` — preview built app
  - `npm run lint` — lint with ESLint

- Server (run inside `server/`):
  - `npm start` — start Express server with nodemon

---

## 🔐 Payments (Stripe Test)

- The app creates Stripe Checkout Sessions when a complaint is resolved.
- Configure `STRIPE_SECRET_KEY` in [server/.env](server/.env) using a Stripe test key.
- Test cards: `4242 4242 4242 4242`, any future date, any CVC.

---

## 🧠 Features

- **Role‑based dashboards**: Requester, Volunteer, Admin, Super Admin
- **Help request lifecycle**: create → open → accepted → in-progress → completed
- **Volunteer workload visibility**: Skills-based matching and availability status
- **Real-time notifications**: In-app notification bell with unread count badge
- **Email alerts**: Automated email notifications via Nodemailer for:
  - New help requests (to available volunteers)
  - Request acceptance (to requesters)
  - Request completion (to both parties)
- **Profile management**: View and edit user profiles for all roles
- **Feedback system**: Rating and comment system for completed requests
- **Stripe checkout**: Payment processing for completed services
- **Landing page**: Feature highlights with animated LottieFiles graphics
- **Super Admin controls**: User management and system overview

---

## 🔍 Troubleshooting

- Port conflicts:
  - Backend uses `3000`; Frontend uses `5173`.
- Env not loaded:
  - Ensure [server/.env](server/.env) exists and `STRIPE_SECRET_KEY` is set.
  - Restart server after changing `.env`.
- CRLF/LF warnings:
  - Safe to ignore; line endings normalized by Git.

---

## 🖼️ Screenshots (Placeholders)

> Add screenshots to `docs/screenshots/` and update the links below.

- Customer Dashboard: ![Customer](docs/screenshots/customer.png)
- Admin Dashboard: ![Admin](docs/screenshots/admin.png)
- Technician Dashboard: ![Technician](docs/screenshots/technician.png)
- Super Admin Dashboard: ![Super Admin](docs/screenshots/superadmin.png)

---

## 🏗️ Tech Stack

- Frontend: React 19, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB (Mongoose)
- Payments: Stripe Checkout

---

## 📜 License

This project is for educational/demo purposes.
