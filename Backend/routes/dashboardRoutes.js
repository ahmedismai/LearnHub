import express from "express";
import mongoose from "mongoose";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { User } from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get(
  "/AdminDashboard",
  protect,
  authorize(ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalCourses,
        totalEnrollments,
        pendingCourses,
        totalStudents,
        totalInstructors
      ] = await Promise.all([
        User.countDocuments(),
        Course.countDocuments(),
        Enrollment.countDocuments(),
        Course.countDocuments({ status: "Pending" }),
        User.countDocuments({ role: ROLES.STUDENT }),
        User.countDocuments({ role: ROLES.INSTRUCTOR }),
      ]);

      res.json({
        totalUsers,
        totalCourses,
        totalEnrollments,
        pendingCourses,
        totalStudents,
        totalInstructors,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.get(
  "/InstructorDashboard",
  protect,
  authorize(ROLES.INSTRUCTOR),
  async (req, res) => {
    try {
      const instructorId = req.user.id;
      
      const [courses, stats] = await Promise.all([
        Course.find({ instructorId }).select("_id status").lean(),
        Course.aggregate([
          { $match: { instructorId: new mongoose.Types.ObjectId(instructorId) } },
          { $group: {
            _id: "$status",
            count: { $sum: 1 }
          }}
        ])
      ]);

      const courseIds = courses.map(c => c._id);
      const totalEnrollments = await Enrollment.countDocuments({ courseId: { $in: courseIds } });

      const statsMap = stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      res.json({
        totalCourses: courses.length,
        pendingCourses: statsMap["Pending"] || 0,
        approvedCourses: statsMap["Approved"] || 0,
        totalEnrollments,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.get(
  "/StudentDashboard",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const enrollments = await Enrollment.find({ studentId: req.user.id }).lean();
      
      const activeCourses = enrollments.filter(
        (item) => item.status === "Active",
      ).length;
      const completedCourses = enrollments.filter(
        (item) => item.status === "Completed",
      ).length;
      
      const totalProgress = enrollments.reduce((sum, item) => sum + (item.progress || 0), 0);
      const averageProgress = enrollments.length ? totalProgress / enrollments.length : 0;

      res.json({
        totalEnrollments: enrollments.length,
        activeCourses,
        completedCourses,
        averageProgress,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

export default router;
