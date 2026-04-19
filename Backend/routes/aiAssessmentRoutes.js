import express from "express";
import { Course } from "../models/Course.js";
import { Content } from "../models/Content.js";
import { calculateStudentLevel } from "../utils/studentLevel.js";
import { generateAssessment } from "../utils/aiService.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route POST /api/AI-Assessment/generate
 * @desc Generate an AI-powered assessment with robust RAG and error handling
 */
router.post("/generate", protect, async (req, res) => {
  const { courseId, type, count } = req.body;
  const studentId = req.user._id;

  try {
    // 1. Validation
    if (!courseId || !type) {
      return res.status(400).json({ message: "Missing courseId or assessment type." });
    }

    console.log(`[AI-CONTROLLER] Request: Type=${type}, Course=${courseId}`);

    // 2. Student Level (Graceful default)
    let level = "Beginner";
    try {
      level = await calculateStudentLevel(studentId, courseId);
    } catch (lvlErr) {
      console.warn(`[AI-CONTROLLER] Level calculation failed, using default: ${level}`);
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
      const assessment = await generateAssessment(ragContext, level, type, count || 5);
      
      console.log(`[AI-CONTROLLER] Successfully generated ${type}.`);
      return res.status(200).json({
        success: true,
        studentLevel: level,
        assessment
      });

    } catch (aiError) {
      console.error("[AI-CONTROLLER] AI Service Error:", aiError.message);
      // Return 502 (Bad Gateway) indicating the AI provider failed
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
