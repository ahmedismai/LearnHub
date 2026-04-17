import express from "express";
import {Enrollment} from "../models/Enrollment.js";
import {Course} from "../models/Course.js";
import { Quiz } from "../models/Quiz.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post("/", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course || course.status !== "Approved") {
      return res.status(404).json({ message: "Course not available" });
    }

    const exists = await Enrollment.findOne({
      studentId: req.user.id,
      courseId,
    });

    if (exists) {
      return res.status(409).json({ message: "Already enrolled" });
    }

    const enrollment = await Enrollment.create({
      studentId: req.user.id,
      courseId,
      paymentStatus: "Paid",
    });

    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/me", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user.id }).populate({
      path: "courseId",
      populate: { path: "instructorId", select: "username email" },
    });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch(
  "/:id/progress",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const { progress } = req.body;

      const enrollment = await Enrollment.findOne({
        _id: req.params.id,
        studentId: req.user.id,
      });

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      const normalizedProgress = Math.max(0, Math.min(100, Number(progress || 0)));
      enrollment.progress = normalizedProgress;
      enrollment.completed = normalizedProgress >= 100;
      await enrollment.save();

      res.json(enrollment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.patch(
  "/:id/complete-lesson",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const { lessonId } = req.body;
      if (!lessonId) {
        return res.status(400).json({ message: "lessonId is required" });
      }

      const enrollment = await Enrollment.findOne({
        _id: req.params.id,
        studentId: req.user.id,
      }).populate("courseId");

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      const course = enrollment.courseId;
      const lessonExists = (course.lessons || []).some(
        (lesson) => String(lesson._id) === String(lessonId)
      );

      if (!lessonExists) {
        return res.status(404).json({ message: "Lesson not found in this course" });
      }

      const completedLessons = new Set(
        (enrollment.completedLessons || []).map(String)
      );
      completedLessons.add(String(lessonId));
      enrollment.completedLessons = Array.from(completedLessons);

      const totalLessons = (course.lessons || []).length;
      const lessonProgress =
        totalLessons > 0
          ? (enrollment.completedLessons.length / totalLessons) * 100
          : 100;

      const courseQuizzes = await Quiz.find({ courseId: course._id }).select("_id");
      const totalQuizzes = courseQuizzes.length;
      const quizProgress =
        totalQuizzes > 0
          ? ((enrollment.completedQuizzes || []).length / totalQuizzes) * 100
          : 100;

      enrollment.progress = Math.min(
        100,
        Math.round((lessonProgress * 0.6) + (quizProgress * 0.4))
      );
      enrollment.completed =
        totalLessons === enrollment.completedLessons.length &&
        totalQuizzes === (enrollment.completedQuizzes || []).length;

      await enrollment.save();

      res.json(enrollment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;
