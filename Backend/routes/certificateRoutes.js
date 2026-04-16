import express from "express";
import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";
import { Quiz } from "../models/Quiz.js";
import { Grade } from "../models/Grade.js";
import { Certificate } from "../models/Certificate.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get(
  "/",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const certificates = await Certificate.find({ studentId: req.user.id })
        .populate("courseId", "title category")
        .sort({ issuedAt: -1 });
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const { courseId } = req.body;
      if (!courseId) {
        return res.status(400).json({ message: "courseId is required" });
      }

      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId,
      });
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const courseQuizzes = await Quiz.find({ courseId }).select("_id");
      const quizIds = courseQuizzes.map((q) => q._id);

      const passedQuizCount = await Grade.countDocuments({
        studentId: req.user.id,
        courseId,
        quizId: { $in: quizIds.length ? quizIds : [null] },
      });

      const totalLessons = (course.lessons || []).length;
      const completedLessons = (enrollment.completedLessons || []).length;
      const totalQuizzes = courseQuizzes.length;
      const completedQuizzes = passedQuizCount;

      const lessonsCompleted = totalLessons === 0 || completedLessons >= totalLessons;
      const quizzesCompleted = totalQuizzes === 0 || completedQuizzes >= totalQuizzes;

      if (!lessonsCompleted || !quizzesCompleted) {
        return res.status(400).json({
          message: "Course completion requirements not met",
          completion: {
            lessons: { completed: completedLessons, total: totalLessons },
            quizzes: { completed: completedQuizzes, total: totalQuizzes },
          },
        });
      }

      enrollment.completed = true;
      enrollment.progress = 100;
      await enrollment.save();

      const certificateUrl = `/api/certificates/download/${courseId}`;
      const certificate = await Certificate.findOneAndUpdate(
        { studentId: req.user.id, courseId },
        { studentId: req.user.id, courseId, issuedAt: new Date(), certificateUrl },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.status(201).json({
        message: "Certificate is ready",
        certificate,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.get(
  "/download/:courseId",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const certificate = await Certificate.findOne({
        studentId: req.user.id,
        courseId: req.params.courseId,
      }).populate("courseId", "title");

      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      res.json({
        certificateId: certificate._id,
        issuedAt: certificate.issuedAt,
        studentId: certificate.studentId,
        course: certificate.courseId,
        downloadable: true,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
