# 🎓 LearnHub – Full-Stack Online Courses Platform

LearnHub is a professional, full-stack online learning platform designed to provide a seamless experience for both instructors and students. It features a modern UI, secure authentication, and dynamic media management.

---

## 🚀 Key Features

* **🔐 Secure Authentication:** Complete Login and Registration system using JWT and Bcrypt.
* **📤 Dynamic Course Creation:** Instructors can create courses and upload thumbnails directly to **Cloudinary**.
* **🔍 Advanced Filtering:** Explore courses by category, difficulty level, and price sorting.
* **🎨 Premium UI/UX:** Built with **shadcn/ui**, **Radix UI**, and **Tailwind CSS** for a sleek, modern look.
* **📱 Fully Responsive:** Optimized for mobile, tablet, and desktop screens.
* **🛠️ Admin Control:** Robust backend architecture ready for course approval and user management.

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
* **Security:** JSON Web Tokens (JWT)

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
git clone [https://github.com/ahmedismai/LearnHub.git](https://github.com/ahmedismai/LearnHub.git)
cd LearnHub
2. Backend Setup
Navigate to the server directory: cd server

Install dependencies: npm install

Create a .env file and add your credentials:

مقتطف الرمز
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
Start the server: npm start

3. Frontend Setup
Navigate to the root/frontend directory.

Install dependencies: npm install

Create a .env file:

مقتطف الرمز
VITE_API_URL=http://localhost:5000/api
Start the app: npm run dev

📄 Project Structure
Plaintext
learnhub/
├── server/             # Express.js Backend
│   ├── models/         # Database Schemas
│   ├── routes/         # API Endpoints
│   └── middleware/     # Auth & Protection
├── src/                # React Frontend
│   ├── components/     # UI Components (shadcn)
│   ├── pages/          # Application Pages
│   ├── contexts/       # Auth & Global State
│   └── api/            # Axios Configuration
└── vercel.json         # Deployment Configuration
✨ Roadmap (Future Improvements)
[ ] Student Enrollment: Allow students to join and track courses.

[ ] Interactive Quizzes: Built-in quiz system for each course.

[ ] Payment Gateway: Stripe/PayPal integration for paid content.

[ ] Certificate Generation: Auto-generate certificates upon completion.

👨‍💻 Author
Ahmed Ismail Amer
Full-Stack Developer

GitHub: https://github.com/ahmedismai

LinkedIn: https://www.linkedin.com/in/ahmed-ismail-amer

⭐ Support
If you find this project helpful, please give it a Star on GitHub!
