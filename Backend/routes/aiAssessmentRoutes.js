import express from "express";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
import { Course } from "../models/Course.js";
import { Content, Assignment, Quiz } from "../models/Content.js";
import { Grade } from "../models/Grade.js";
import { Submission } from "../models/Submission.js";
import { Exam } from "../models/Exam.js";
import { calculateStudentLevel } from "../utils/studentLevel.js";
import { generateAssessment, generateFeedback } from "../utils/aiService.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
const levelCache = new NodeCache({ stdTTL: 600 }); // Cache level for 10 minutes

// Rate limiter for AI generation (expensive)
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
});

/**
 * @route POST /api/AI-Assessment/feedback
 * @desc Generate and store AI feedback for a specific grade
 */
router.post("/feedback", protect, aiRateLimiter, async (req, res) => {
  const { gradeId } = req.body;

  try {
    const grade = await Grade.findById(gradeId);
    if (!grade) return res.status(404).json({ message: "Grade not found" });

    if (grade.aiFeedback) {
      return res.status(200).json({ feedback: grade.aiFeedback });
    }

    // Find the submission to get answers/file
    const filter = { 
      studentId: grade.studentId,
      type: grade.type
    };
    if (grade.quizId) filter.contentId = grade.quizId;
    if (grade.examId) filter.examId = grade.examId;
    if (grade.assignmentId) filter.contentId = grade.assignmentId;

    const submission = await Submission.findOne(filter).lean();
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    // Get assessment data
    let assessmentData = null;
    if (grade.type === "Exam") {
      assessmentData = await Exam.findById(grade.examId).lean();
    } else if (grade.type === "Quiz") {
      assessmentData = await Quiz.findById(grade.quizId).lean();
    } else if (grade.type === "Assignment") {
      assessmentData = await Assignment.findById(grade.assignmentId).lean();
    }

    if (!assessmentData) return res.status(404).json({ message: "Assessment data not found" });

    const feedback = await generateFeedback(grade.type, assessmentData, submission);
    
    grade.aiFeedback = feedback;
    await grade.save();

    res.json({ feedback });
  } catch (error) {
    console.error("[AI-FEEDBACK-ERROR]:", error);
    res.status(500).json({ message: "Failed to generate AI feedback" });
  }
});


/**
 * @route POST /api/AI-Assessment/generate
 * @desc Generate an AI-powered assessment with robust RAG and error handling
 */
router.post("/generate", protect, aiRateLimiter, async (req, res) => {
  const { courseId, type, count } = req.body;
  const studentId = req.user._id;

  try {
    // 1. Validation
    if (!courseId || !type) {
      return res.status(400).json({ message: "Missing courseId or assessment type." });
    }

    console.log(`[AI-CONTROLLER] Request: Type=${type}, Course=${courseId}`);

    // 2. Student Level (With caching)
    const cacheKey = `level_${studentId}_${courseId}`;
    let level = levelCache.get(cacheKey);
    
    if (!level) {
      try {
        level = await calculateStudentLevel(studentId, courseId);
        levelCache.set(cacheKey, level);
      } catch (lvlErr) {
        console.warn(`[AI-CONTROLLER] Level calculation failed, using default: Beginner`);
        level = "Beginner";
      }
    }

    // 3. Robust Context Retrieval (RAG)
    const course = await Course.findById(courseId).select("title description").lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const contents = await Content.find({ courseId })
      .select("title description contentType")
      .lean();

    const contextItems = contents.map(c => 
      `[${c.contentType}] ${c.title}: ${c.description || 'No detailed description available.'}`
    );

    const ragContext = `
      COURSE TITLE: ${course.title}
      COURSE OVERVIEW: ${course.description}
      CONTENT DETAILS:
      ${contextItems.length > 0 ? contextItems.join("\n") : "No specific lessons found."}
    `;

    // 4. Generation with specific error handling
    try {
      const assessment = await generateAssessment(ragContext, level, type, count);
      
      console.log(`[AI-CONTROLLER] Successfully generated ${type} with ${count} items.`);
      return res.status(200).json({
        success: true,
        studentLevel: level,
        assessment
      });

    } catch (aiError) {
      console.error("[AI-CONTROLLER] AI Service Error:", aiError.message);
      return res.status(502).json({ 
        message: "The AI service is currently unable to fulfill the request.",
        error: aiError.message 
      });
    }

  } catch (error) {
    console.error("[AI-CONTROLLER-CRITICAL]:", error);
    return res.status(500).json({ 
      message: "A critical server error occurred during AI processing.",
      details: error.message 
    });
  }
});

export default router;
