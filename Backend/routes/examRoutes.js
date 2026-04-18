import express from "express";
import { Exam } from "../models/Exam.js";
import { Course } from "../models/Course.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const exams = await Exam.find({ status: "Published" }).populate(
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

      const exam = new Exam({
        courseId,
        instructorId: req.user.id,
        title,
        description,
        duration,
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
router.get("/:id", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
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
      exam.status = req.body.status || exam.status;
      exam.totalMarks = req.body.totalMarks || exam.totalMarks;
      if (req.body.questions) {
        exam.questions = req.body.questions;
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
