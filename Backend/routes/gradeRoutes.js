import express from "express";
import { Grade } from "../models/Grade.js";
import { Course } from "../models/Course.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get(
  "/Instructor/AllGrades",
  protect,
  authorize(ROLES.INSTRUCTOR),
  async (req, res) => {
    try {
      const courses = await Course.find({ instructorId: req.user.id });
      const courseIds = courses.map((c) => c._id);
      const grades = await Grade.find({ courseId: { $in: courseIds } })
        .populate("studentId", "name email")
        .populate("courseId", "title")
        .populate("quizId", "title")
        .populate("examId", "title")
        .populate("assignmentId", "title")
        .sort({ createdAt: -1 });

      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/me",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const grades = await Grade.find({ studentId: req.user.id })
        .populate("courseId", "title")
        .populate("quizId", "title")
        .sort({ createdAt: -1 });

      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
