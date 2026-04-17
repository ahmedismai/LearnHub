# 🎓 LearnHub – Full-Stack Online Courses Platform

LearnHub is a professional, full-stack online learning platform designed to provide a seamless experience for both instructors and students. This project is strictly aligned with the architectural design specified in its UML Class and Sequence diagrams.

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** React 18 (Vite)
- **State Management:** TanStack Query (React Query)
- **Styling:** Tailwind CSS + shadcn/ui + Lucide Icons
- **Routing:** React Router DOM
- **Authentication:** JWT + Context API

### Backend

- **Runtime:** Node.js + Express.js
- **Database:** MongoDB Atlas (Mongoose)
- **Inheritance Pattern:** Mongoose Discriminators (for Users, Content, and Payments)
- **Media Management:** Cloudinary API
- **Security:** bcryptjs + JSON Web Tokens

---

## 🏗️ System Architecture (Database Schema)

The system utilizes an advanced inheritance-based schema for 100% alignment with the UML design.

### 👥 User Inheritance System

- **Base User:** `id`, `name`, `email`, `passwordHash`, `role`.
- **Admin:** Inherits User, adds `adminId`.
- **Instructor:** Inherits User, adds `instructorId`, `bio`.
- **Student:** Inherits User, adds `studentId`, `enrollmentDate`.

### 📚 Course & Content System

- **Category:** `categoryId`, `name`, `description`.
- **Course:** `courseId`, `title`, `description`, `price`, `level`. (Linked to Category and Instructor).
- **Content (Base):** `contentId`, `title`, `description`, `type`, `duration`.
  - **Lesson:** Inherits Content, adds `contentUrl`.
  - **Quiz:** Inherits Content, adds `totalMarks`. (Linked to Questions).
  - **Assignment:** Inherits Content, adds `dueDate`.

### 💳 Enrollment & Payment System

- **Enrollment:** `enrollmentId`, `date`, `status`, `progress`. (Links Student to Course).
- **Payment (Base):** `paymentId`, `amount`, `date`, `method`.
  - **Visa:** Inherits Payment, adds `status`.
  - **E-Wallet:** Inherits Payment, adds `status`.

---

## 🚀 Key Features

- **🔐 Secure RBAC:** Role-Based Access Control for Students, Instructors, and Administrators.
- **📚 Content Hierarchy:** Unified content system for lessons, quizzes, and assignments.
- **📊 Progress Tracking:** Automated progress calculation (40% Lessons, 30% Quizzes, 30% Assignments).
- **💳 Multi-Method Payments:** Support for Visa and E-Wallet payment simulations.
- **🎓 Certificate Generation:** Automated certificate issuance upon 100% course completion.
- **📝 Review System:** Students can rate and review courses they are enrolled in.
- **🛠️ Admin Control:** Comprehensive management of users, categories, and course approvals.

---

## 📦 Installation & Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ahmedismai/LearnHub.git
cd LearnHub
```

### 2. Backend Setup

```bash
cd Backend
npm install
# Configure .env with MONGO_URI, JWT_SECRET, CLOUDINARY_URL, etc.
npm start
```

### 3. Frontend Setup

```bash
cd ../Frontend
npm install
# Configure .env with VITE_API_URL
npm run dev
```

---

## 📄 UML Alignment

The codebase has been refactored to achieve **100% parity** with:

- `Frontend/class.jpeg` (Class Diagram)
- `Frontend/sequence.jpeg` (Sequence Diagram)

---

## 👨‍💻 Author

**Ahmed Ismail Amer**
Full-Stack Developer

- **GitHub:** [https://github.com/ahmedismai](https://github.com/ahmedismai)
- **LinkedIn:** [https://www.linkedin.com/in/ahmed-ismail-amer](https://www.linkedin.com/in/ahmed-ismail-amer)
