import express from "express";
import { Exam } from "../models/Exam.js";
import { Course } from "../models/Course.js";
import { ExamResult } from "../models/ExamResult.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    let query = { status: "Published" };
    if (req.user.role === ROLES.INSTRUCTOR) {
      query = { instructorId: req.user.id };
    } else if (req.user.role === ROLES.ADMINISTRATOR) {
      query = {};
    } else if (req.user.role === ROLES.STUDENT) {
      const { Enrollment } = await import("../models/Enrollment.js");
      const enrollments = await Enrollment.find({ studentId: req.user.id });
      const courseIds = enrollments.map((e) => e.courseId);
      query = { courseId: { $in: courseIds }, status: "Published" };
    }
    
    const exams = await Exam.find(query).populate(
      "courseId",
      "title",
    );
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const {
        courseId,
        title,
        description,
        duration,
        examDate,
        endDate,
        status,
        totalMarks,
        questions,
      } = req.body;
      if (!courseId || !title || !description || !questions?.length) {
        return res.status(400).json({
          message: "courseId, title, description and questions are required",
        });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to create exam for this course" });
      }

      const startDate = examDate ? new Date(examDate) : new Date();
      const finishDate = endDate
        ? new Date(endDate)
        : new Date(startDate.getTime() + Number(duration || 30) * 60 * 1000);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(finishDate.getTime())
      ) {
        return res.status(400).json({ message: "Invalid exam date range" });
      }

      if (finishDate <= startDate) {
        return res
          .status(400)
          .json({ message: "End date must be after start date" });
      }

      const exam = new Exam({
        courseId,
        instructorId: req.user.id,
        title,
        description,
        duration,
        examDate: startDate,
        endDate: finishDate,
        status: status || "Draft",
        totalMarks: totalMarks || 100,
        questions,
      });
      await exam.save();
      res.status(201).json(exam);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get("/ByCourse/:courseId", async (req, res) => {
  try {
    const exams = await Exam.find({ courseId: req.params.courseId }).populate(
      "courseId",
      "title",
    );
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/Details/:examId", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alias route for frontend compatibility
router.get("/:id", protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Check if already submitted - Specific to this Exam ID
    if (req.user.role === ROLES.STUDENT) {
      const { Submission } = await import("../models/Submission.js");
      const existingSubmission = await Submission.findOne({
        studentId: req.user.id,
        examId: exam._id,
        type: "Exam"
      });
      if (existingSubmission) {
        return res.status(403).json({ message: "Assessment already completed" });
      }
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/StartExam/:examId",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.examId);
      if (!exam || exam.status !== "Published") {
        return res
          .status(404)
          .json({ message: "Exam not found or not published" });
      }

      const now = new Date();
      if (exam.examDate && now < exam.examDate) {
        return res.status(403).json({ message: "Exam has not started yet" });
      }
      if (exam.endDate && now > exam.endDate) {
        return res.status(403).json({ message: "Exam has expired" });
      }

      // Check if already submitted - Specific to this Exam ID
      const { Submission } = await import("../models/Submission.js");
      const existingSubmission = await Submission.findOne({
        studentId: req.user.id,
        examId: exam._id,
        type: "Exam"
      });
      if (existingSubmission) {
        return res.status(403).json({ message: "Assessment already completed" });
      }

      const examPayload = exam.toObject();
      examPayload.questions = examPayload.questions.map((question) => ({
        questionId: question._id,
        text: question.text,
        type: question.type,
        options: question.options,
      }));

      res.json(examPayload);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.patch(
  "/:examId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      const course = await Course.findById(exam.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this exam" });
      }

      exam.title = req.body.title || exam.title;
      exam.description = req.body.description || exam.description;
      exam.duration = req.body.duration || exam.duration;
      if (req.body.examDate || req.body.endDate) {
        const startDate = req.body.examDate
          ? new Date(req.body.examDate)
          : exam.examDate;
        const finishDate = req.body.endDate
          ? new Date(req.body.endDate)
          : exam.endDate;

        if (
          Number.isNaN(startDate?.getTime()) ||
          Number.isNaN(finishDate?.getTime()) ||
          finishDate <= startDate
        ) {
          return res.status(400).json({ message: "Invalid exam date range" });
        }

        exam.examDate = startDate;
        exam.endDate = finishDate;
      }
      exam.status = req.body.status || exam.status;
      exam.totalMarks = req.body.totalMarks || exam.totalMarks;
      if (req.body.questions) {
        exam.questions = req.body.questions;
      }
      if (!exam.examDate) {
        exam.examDate = exam.createdAt || new Date();
      }
      if (!exam.endDate) {
        exam.endDate = new Date(
          exam.examDate.getTime() + Number(exam.duration || 30) * 60 * 1000,
        );
      }
      await exam.save();
      res.json(exam);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.delete(
  "/:examId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      const course = await Course.findById(exam.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this exam" });
      }

      await exam.deleteOne();
      res.json({ message: "Exam deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
