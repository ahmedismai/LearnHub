import express from "express";
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
      const totalUsers = await User.countDocuments();
      const totalCourses = await Course.countDocuments();
      const totalEnrollments = await Enrollment.countDocuments();
      const pendingCourses = await Course.countDocuments({ status: "Pending" });
      const totalStudents = await User.countDocuments({ role: ROLES.STUDENT });
      const totalInstructors = await User.countDocuments({
        role: ROLES.INSTRUCTOR,
      });

      res.json({
        totalUsers,
        totalCourses,
        totalEnrollments,
        pendingCourses,
        totalStudents,
        totalInstructors,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get(
  "/InstructorDashboard",
  protect,
  authorize(ROLES.INSTRUCTOR),
  async (req, res) => {
    try {
      const courses = await Course.find({ instructorId: req.user.id });
      const totalCourses = courses.length;
      const pendingCourses = courses.filter(
        (course) => course.status === "Pending",
      ).length;
      const approvedCourses = courses.filter(
        (course) => course.status === "Approved",
      ).length;
      const enrollments = await Enrollment.find({
        courseId: { $in: courses.map((course) => course._id) },
      });

      res.json({
        totalCourses,
        pendingCourses,
        approvedCourses,
        totalEnrollments: enrollments.length,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get(
  "/StudentDashboard",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const enrollments = await Enrollment.find({ studentId: req.user.id });
      const activeCourses = enrollments.filter(
        (item) => item.status === "Active",
      ).length;
      const completedCourses = enrollments.filter(
        (item) => item.status === "Completed",
      ).length;
      const averageProgress = enrollments.length
        ? enrollments.reduce((sum, item) => sum + (item.progress || 0), 0) /
          enrollments.length
        : 0;

      res.json({
        totalEnrollments: enrollments.length,
        activeCourses,
        completedCourses,
        averageProgress,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
