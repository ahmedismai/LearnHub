import express from "express";
import {Quiz} from "../models/Quiz.js";
import {Course} from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Grade } from "../models/Grade.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get("/course/:courseId", protect, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ courseId: req.params.courseId });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/course/:courseId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res.status(403).json({ message: "Not owner of this course" });
      }

      const quiz = await Quiz.create({
        ...req.body,
        courseId: req.params.courseId,
      });
      res.status(201).json(quiz);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.post(
  "/:quizId/submit",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const { answers = [] } = req.body;
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: quiz.courseId,
      });
      if (!enrollment) {
        return res.status(403).json({ message: "You are not enrolled in this course" });
      }

      const maxScore = quiz.questions.length;
      let score = 0;

      quiz.questions.forEach((question, index) => {
        if (Number(answers[index]) === Number(question.correctAnswerIndex)) {
          score += 1;
        }
      });

      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      const grade = await Grade.findOneAndUpdate(
        { studentId: req.user.id, quizId: quiz._id },
        {
          studentId: req.user.id,
          courseId: quiz.courseId,
          quizId: quiz._id,
          score,
          maxScore,
          percentage,
          submittedAnswers: answers,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const completedQuizzes = new Set(
        (enrollment.completedQuizzes || []).map((id) => String(id))
      );
      completedQuizzes.add(String(quiz._id));
      enrollment.completedQuizzes = Array.from(completedQuizzes);

      await enrollment.save();

      res.status(201).json({
        message: "Quiz submitted successfully",
        grade,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;
