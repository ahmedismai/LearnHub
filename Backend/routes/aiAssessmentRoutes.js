import express from "express";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Content.js";
import { calculateStudentLevel } from "../utils/studentLevel.js";
import { generateAssessment } from "../utils/aiService.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route POST /api/ai-assessment/generate
 * @desc Generate an AI-powered assessment based on student level and course content
 * @access Private
 */
router.post("/generate", protect, async (req, res) => {
  try {
    const { courseId, type, count } = req.body;
    const studentId = req.user._id;

    console.log(`[AI-RAG] Generating ${type} for course ${courseId}...`);

    if (!courseId || !type) {
      return res.status(400).json({ message: "Course ID and type are required" });
    }

    // 1. Calculate student level
    const level = await calculateStudentLevel(studentId, courseId).catch(err => {
      console.error("[AI-RAG] Level Calculation Error:", err);
      return "Beginner"; // Fallback
    });

    // 2. Retrieve course context (RAG - Retrieval)
    const course = await Course.findById(courseId).catch(err => {
      console.error("[AI-RAG] Course DB Error:", err);
      return null;
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found in database" });
    }

    const allContent = await Content.find({ courseId }).catch(err => {
      console.error("[AI-RAG] Content DB Error:", err);
      return [];
    });
    
    const contentContext = allContent
      .map((c) => {
        return `Type: ${c.contentType}\nTitle: ${c.title}\nDescription: ${c.description || 'No description'}`;
      })
      .join("\n\n---\n\n");

    const fullContext = `
      COURSE: ${course.title}
      OVERVIEW: ${course.description}
      CONTENT:
      ${contentContext || 'No lessons added yet.'}
    `;

    // 3. Generate Assessment (RAG - Generation)
    try {
      const assessment = await generateAssessment(fullContext, level, type, count || 5);
      res.json({
        studentLevel: level,
        assessment
      });
    } catch (aiErr) {
      console.error("[AI-RAG] Gemini/AI Service Error:", aiErr.message);
      res.status(502).json({ 
        message: "AI Service failed to generate content. Please check if GEMINI_API_KEY is valid.",
        error: aiErr.message 
      });
    }
  } catch (error) {
    console.error("AI Generation Route Critical Error:", error);
    res.status(500).json({ message: "Internal server error during AI generation" });
  }
});

export default router;
