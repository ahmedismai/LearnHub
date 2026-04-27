# 🎓 LearnHub – Professional E-Learning Ecosystem

[![React](https://img.shields.io/badge/Frontend-React%2018-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20Express-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightgreen)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

LearnHub is a high-performance, full-stack online learning platform. It is engineered with a focus on **Database Integrity**, **Scalable Architecture**, and a **Seamless User Experience** for students, instructors, and administrators.

---

## 🚀 Recent Enhancements & Stability
We have recently implemented critical updates to ensure system reliability:
- **🛠️ Smart Database Cleanup:** Automatic legacy index management to prevent submission conflicts.
- **🎯 Precision Assessment Tracking:** Refined Grade model to allow multiple assessment types (Quizzes/Exams) to coexist without interference.
- **🧪 Robust Error Handling:** Step-by-step transaction logging for assessment submissions.
- **✨ Normalized UI State:** Enhanced frontend state management for 100% accurate answer capturing.

---

## 🛠️ Tech Stack

### Frontend
- **Core:** React 18 (Vite) with Functional Components & Hooks.
- **Data Fetching:** TanStack Query (v5) for caching and server-state sync.
- **UI Architecture:** Tailwind CSS + shadcn/ui + Lucide Icons.
- **State Management:** Context API for Global Auth & Theme.

### Backend
- **Engine:** Node.js + Express.js (ES Modules).
- **ORM/ODM:** Mongoose with **Discriminator Patterns** for optimized inheritance.
- **Storage:** Cloudinary integration for media and assignment uploads.
- **Security:** JWT Authentication, Bcrypt password hashing, and CORS protection.

---

## 🏗️ System Architecture

### 👥 User Roles (RBAC)
- **Student:** Course enrollment, progress tracking, and certificate generation.
- **Instructor:** Course creation, curriculum management, and student assessment.
- **Administrator:** Platform-wide oversight, category management, and user auditing.

### 📊 Automated Progress Engine
The system calculates student progress using a weighted algorithm:
- **40%** Lesson Completion.
- **30%** Quiz Performance.
- **30%** Assignment Submissions.

---

## 📦 Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account or Local Instance
- Cloudinary Account (for media)

### 2. Installation
```bash
# Clone the project
git clone https://github.com/ahmedismai/LearnHub.git
cd LearnHub

# Install Backend dependencies
cd Backend
npm install

# Setup Environment Variables (.env)
# MONGO_URI, JWT_SECRET, PORT, CLOUDINARY_CLOUD_NAME, etc.

# Run Backend
npm start

# Install Frontend dependencies
cd ../Frontend
npm install
npm run dev
```

---

## 📄 Architecture Alignment
The project is strictly mapped to the following architectural blueprints:
- **Class Diagram:** `Frontend/class.jpeg`
- **Sequence Diagram:** `Frontend/sequence.jpeg`

---

## 👨‍💻 Developed By
**Ahmed Ismail Amer**
*Full-Stack Software Engineer*

- **LinkedIn:** [Ahmed Ismail Amer](https://www.linkedin.com/in/ahmed-ismail-amer)
- **GitHub:** [@ahmedismai](https://github.com/ahmedismai)

---
*LearnHub - Empowering the next generation of learners.*
