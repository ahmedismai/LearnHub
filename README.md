# 🎓 LearnHub – Full-Stack Online Courses Platform

LearnHub is a professional, full-stack online learning platform designed to provide a seamless experience for both instructors and students. It features a modern UI, secure authentication, and dynamic media management.

---

## 🚀 Key Features

* **🔐 Secure Authentication:** Complete Login and Registration system using JWT and Bcrypt. Now uses `username` and `passwordHash` for enhanced security.
* **🛠️ Admin Dashboard:** Comprehensive control panel for platform administrators to manage the entire ecosystem.
* **👥 User & Permission Management:** Role-based access control (RBAC) allowing admins to promote users to 'Instructor' or 'Administrator' roles.
* **📚 Advanced Course Management:** Dedicated approval workflow for administrators to review, approve, or reject courses before they go live.
* **📊 Platform Analytics:** Real-time system statistics and platform-wide analytics, including user growth, course count, and system health metrics (uptime, memory usage).
* **📤 Dynamic Course Creation:** Instructors can create courses and upload thumbnails directly to **Cloudinary**.
* **🔍 Advanced Filtering:** Explore courses by category, difficulty level, and price sorting.
* **🎨 Premium UI/UX:** Built with **shadcn/ui**, **Radix UI**, and **Tailwind CSS** for a sleek, modern look.
* **📱 Fully Responsive:** Optimized for mobile, tablet, and desktop screens.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** React 18 (Vite)
* **Styling:** Tailwind CSS + Lucide Icons
* **Components:** shadcn/ui + Radix UI
* **Data Fetching:** TanStack Query (React Query) + Axios
* **Routing:** React Router DOM

### Backend
* **Server:** Node.js + Express.js
* **Database:** MongoDB Atlas (Mongoose)
* **Storage:** Cloudinary API (via Multer)
* **Security:** JSON Web Tokens (JWT) + Bcrypt

---

## 🌍 Live Demo

### 🎨 Frontend (Client Side)
🔗 [https://learn-hub-psxx.vercel.app/](https://learn-hub-psxx.vercel.app/)

### ⚙️ Backend (API Server)
🔗 [https://learn-hub-rho-ashen.vercel.app/api](https://learn-hub-rho-ashen.vercel.app/api)

---

## 📦 Installation & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ahmedismai/LearnHub.git
cd LearnHub
```

### 2. Backend Setup
Navigate to the Backend directory:
```bash
cd Backend
```
Install dependencies:
```bash
npm install
```
Create a `.env` file and add your credentials:
```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
PORT=5000
```
Start the server:
```bash
npm start
```

### 3. Frontend Setup
Navigate to the Frontend directory:
```bash
cd ../Frontend
```
Install dependencies:
```bash
npm install
```
Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```
Start the app:
```bash
npm run dev
```

---

## 📄 Project Structure

```plaintext
LearnHub/
├── Backend/            # Express.js Backend
│   ├── models/         # Mongoose Schemas (User, Course, Enrollment, etc.)
│   ├── routes/         # API Endpoints (Auth, Admin, Courses, etc.)
│   ├── middleware/     # Auth, Protection & RBAC
│   └── constants/      # Global constants (Roles, etc.)
├── Frontend/           # React Frontend
│   ├── src/
│   │   ├── components/ # UI Components (shadcn)
│   │   ├── pages/      # Application Pages (AdminDashboard, Courses, etc.)
│   │   ├── contexts/   # Auth & Global State
│   │   ├── api/        # Axios Configuration
│   │   └── hooks/      # Custom React Hooks
│   └── vercel.json     # Deployment Configuration
└── README.md
```

---

## ✨ Roadmap (Current Status)

* [x] **Secure Authentication:** JWT-based login/register with RBAC.
* [x] **Admin Dashboard:** Full control over users and courses.
* [x] **Course Approval:** workflow for platform quality control.
* [x] **Student Enrollment:** Students can join and track courses.
* [x] **Interactive Quizzes:** Built-in quiz system (Backend models ready).
* [x] **Certificate Generation:** Backend models and logic in place.
* [ ] **Payment Gateway:** Integration for Stripe/PayPal.
* [ ] **Gamification:** Points and badges for student engagement.

---

## 👨‍💻 Author

**Ahmed Ismail Amer**
Full-Stack Developer

* **GitHub:** [https://github.com/ahmedismai](https://github.com/ahmedismai)
* **LinkedIn:** [https://www.linkedin.com/in/ahmed-ismail-amer](https://www.linkedin.com/in/ahmed-ismail-amer)

---

## ⭐ Support
If you find this project helpful, please give it a Star on GitHub!
