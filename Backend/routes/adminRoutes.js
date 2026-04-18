import express from 'express';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Payment } from '../models/Payment.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Apply protection and admin authorization to all routes in this router
router.use(protect);
router.use(authorize(ROLES.ADMINISTRATOR));

// Module 1: User & Permission Management - Display all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Module 1: User & Permission Management - Apply role-based access control
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Module 1: User & Permission Management - Delete User
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Module 3: Platform Statistics - View system statistics and Retrieve platform-wide analytics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalStudents = await User.countDocuments({ role: ROLES.STUDENT });
    const totalInstructors = await User.countDocuments({ role: ROLES.INSTRUCTOR });

    // Calculate total revenue from successful payments
    const payments = await Payment.find({ status: "Success" });
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
    
    // System health (mocking for now as it's a typical requirement for "system health")
    const systemHealth = {
      status: "Healthy",
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };

    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalStudents,
      totalInstructors,
      totalRevenue,
      systemHealth
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
