import express from "express";
import { Content, Quiz } from "../models/Content.js";
import { Question } from "../models/Question.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Grade } from "../models/Grade.js";
import { Submission } from "../models/Submission.js";
import { updateEnrollmentProgress } from "../utils/progress.js";
import { updateGrade } from "../utils/gradeUpdater.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// Get all quizzes based on role
router.get("/", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === ROLES.INSTRUCTOR) {
      const courses = await Course.find({ instructorId: req.user.id });
      const courseIds = courses.map((c) => c._id);
      query = { courseId: { $in: courseIds } };
    } else if (req.user.role === ROLES.STUDENT) {
      const enrollments = await Enrollment.find({ studentId: req.user.id });
      const courseIds = enrollments.map((e) => e.courseId);
      query = { courseId: { $in: courseIds } };
    } else if (req.user.role === ROLES.ADMINISTRATOR) {
      query = {};
    }

    const quizzes = await Quiz.find({
      ...query,
      contentType: "Quiz",
    }).populate("courseId", "title");
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all quizzes for an instructor or admin
router.get("/Instructor/AllQuizzes", protect, authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR), async (req, res) => {
  try {
    let query = {};
    if (req.user.role === ROLES.INSTRUCTOR) {
      const courses = await Course.find({ instructorId: req.user.id });
      const courseIds = courses.map(c => c._id);
      query = { courseId: { $in: courseIds } };
    }
    
    const quizzes = await Quiz.find({
      ...query,
      contentType: "Quiz",
    }).populate("courseId", "title");
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get quizzes for a course
router.get("/course/:courseId", protect, async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      courseId: req.params.courseId,
      contentType: "Quiz",
    });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get quiz details by ID
router.get("/:quizId", protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz || quiz.contentType !== "Quiz") {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if already submitted - STRICTLY for this Quiz ID and Type
    if (req.user.role === ROLES.STUDENT) {
      const existingSubmission = await Submission.findOne({
        studentId: req.user.id,
        contentId: quiz._id,
        type: "Quiz" 
      });
      if (existingSubmission) {
        return res.status(403).json({ message: "Assessment already completed" });
      }
    }

    const questions = await Question.find({ quizId: quiz._id })
      .sort({ _id: 1 })
      .select("-correctAnswer");

    res.json({ ...quiz.toObject(), questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit quiz answers
router.post(
  "/:quizId/submit",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const { answers = [] } = req.body; 
      console.log(`[QUIZ-SUBMIT] Received answers for quiz ${req.params.quizId}:`, JSON.stringify(answers));
      
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz || quiz.contentType !== "Quiz") {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const questions = await Question.find({ quizId: quiz._id }).sort({ _id: 1 });
      let score = 0;
      const maxScore = questions.length;

      const gradedAnswers = questions.map((q, idx) => {
        // Aggressive matching: find by ID or by Index
        const studentAnsObj = answers.find(
          (a) => String(a.questionId) === String(q._id)
        ) || answers[idx];
        
        const studentAnswer = studentAnsObj?.answer;
        
        // Match logic
        const isCorrect = !!(studentAnswer && q.correctAnswer && 
                          String(studentAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase());
        
        if (isCorrect) score += 1;

        console.log(`[QUIZ-MATCH] Q#${idx+1}: DB="${q.correctAnswer}" VS Student="${studentAnswer}" | Result=${isCorrect}`);

        return {
          questionId: q._id,
          selectedOption: studentAnswer || "No Answer",
          isCorrect
        };
      });

      console.log(`[QUIZ-SCORE]: Student ${req.user.id} scored ${score}/${maxScore}`);

      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      const submission = new Submission({
        contentId: quiz._id,
        courseId: quiz.courseId,
        studentId: req.user.id,
        type: "Quiz",
        answers: gradedAnswers,
        score: percentage,
        totalQuestions: maxScore,
        correctCount: score,
        status: "Graded"
      });
      await submission.save();

      const grade = await updateGrade({
        studentId: req.user.id,
        courseId: quiz.courseId,
        quizId: quiz._id,
        type: "Quiz",
        score,
        maxScore,
      });

      // Update enrollment...
      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: quiz.courseId,
      });
      if (enrollment) {
        const completedQuizzes = new Set((enrollment.completedQuizzes || []).map(id => String(id)));
        completedQuizzes.add(String(quiz._id));
        enrollment.completedQuizzes = Array.from(completedQuizzes);
        await updateEnrollmentProgress(enrollment);
      }

      res.status(201).json({ 
        message: "Quiz submitted successfully", 
        score: percentage,
        correctCount: score,
        totalQuestions: maxScore,
        grade 
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
);

export default router;
