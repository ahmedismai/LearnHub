import express from "express";
import { Exam } from "../models/Exam.js";
import { Course } from "../models/Course.js";
import { ExamResult } from "../models/ExamResult.js";
import { Enrollment } from "../models/Enrollment.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import { updateGrade } from "../utils/gradeUpdater.js";

const router = express.Router();

router.post("/Submit", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const { examId, answers = [] } = req.body;
    if (!examId || !answers.length) {
      return res
        .status(400)
        .json({ message: "examId and answers are required" });
    }

    const exam = await Exam.findById(examId);
    if (!exam || exam.status !== "Published") {
      return res.status(404).json({ message: "Exam not found" });
    }

    const maxScore = exam.questions.length;
    const correctAnswers = exam.questions.reduce((acc, question) => {
      acc[String(question._id)] = question.correctAnswer;
      return acc;
    }, {});

    let score = 0;
    const answerRecords = answers.map((answer) => {
      const isCorrect =
        correctAnswers[String(answer.questionId)] === answer.answer;
      if (isCorrect) score += 1;
      return { questionId: answer.questionId, answer: answer.answer };
    });

    const percentage = maxScore ? (score / maxScore) * 100 : 0;

    const examResult = await ExamResult.findOneAndUpdate(
      { studentId: req.user.id, examId },
      {
        studentId: req.user.id,
        examId,
        courseId: exam.courseId,
        score,
        totalMarks: maxScore,
        percentage,
        answers: answerRecords,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // PERSIST TO GRADE MODEL
    await updateGrade({
      studentId: req.user.id,
      courseId: exam.courseId,
      examId,
      type: "Exam",
      score,
      maxScore,
    });

    await Enrollment.findOneAndUpdate(
      { studentId: req.user.id, courseId: exam.courseId },
      { $set: { progress: 100 } },
    );

    res
      .status(201)
      .json({ message: "Exam submitted successfully", examResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  "/Instructor/AllResults",
  protect,
  authorize(ROLES.INSTRUCTOR),
  async (req, res) => {
    try {
      const courses = await Course.find({ instructorId: req.user.id });
      const courseIds = courses.map((c) => c._id);
      const results = await ExamResult.find({ courseId: { $in: courseIds } })
        .populate("studentId", "name email")
        .populate("examId", "title")
        .populate("courseId", "title");
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get(
  "/ByExam/:examId/me",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const result = await ExamResult.findOne({
        examId: req.params.examId,
        studentId: req.user.id,
      });
      if (!result) return res.status(404).json({ message: "No result found" });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get("/:id", protect, async (req, res) => {
  try {
    const examResult = await ExamResult.findById(req.params.id);
    if (!examResult) {
      return res.status(404).json({ message: "Exam result not found" });
    }
    if (
      req.user.role === ROLES.STUDENT &&
      String(examResult.studentId) !== String(req.user.id)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this result" });
    }
    res.json(examResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  "/ByExam/:examId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const results = await ExamResult.find({ examId: req.params.examId });
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get(
  "/StudentResults/:courseId",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const results = await ExamResult.find({
        courseId: req.params.courseId,
        studentId: req.user.id,
      });
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
