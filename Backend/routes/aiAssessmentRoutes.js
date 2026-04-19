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

    if (!courseId || !type) {
      return res.status(400).json({ message: "Course ID and type are required" });
    }

    // 1. Calculate student level
    const level = await calculateStudentLevel(studentId, courseId);

    // 2. Retrieve course context (RAG - Retrieval)
    const course = await Course.findById(courseId).populate('sections');
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const allContent = await Content.find({ courseId });
    
    // Group content by type for better AI understanding
    const lessons = allContent.filter(c => c.contentType === 'Lesson');
    const quizzes = allContent.filter(c => c.contentType === 'Quiz');
    const assignments = allContent.filter(c => c.contentType === 'Assignment');

    const contentContext = allContent
      .map((c) => {
        let extra = '';
        if (c.contentType === 'Lesson') extra = `(Video Lesson)`;
        if (c.contentType === 'Quiz') extra = `(Existing Quiz with ${c.totalMarks || 100} marks)`;
        if (c.contentType === 'Assignment') extra = `(Assignment due ${c.dueDate})`;
        
        return `Type: ${c.contentType} ${extra}\nTitle: ${c.title}\nDescription: ${c.description}`;
      })
      .join("\n\n---\n\n");

    const fullContext = `
      COURSE OVERVIEW:
      Title: ${course.title}
      Description: ${course.description}
      Difficulty Level: ${course.level}

      DETAILED COURSE CONTENT:
      ${contentContext}
    `;

    // 3. Generate Assessment (RAG - Generation)
    const assessment = await generateAssessment(fullContext, level, type, count);

    res.json({
      studentLevel: level,
      assessment
    });
  } catch (error) {
    console.error("AI Generation Route Error:", error);
    res.status(500).json({ message: "Internal server error during AI generation" });
  }
});

export default router;
