import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Generates an assessment based on content and student level.
 * @param {string} context - The course content/lessons text.
 * @param {string} level - Student level (Beginner, Intermediate, Advanced).
 * @param {string} type - 'Quiz' | 'Assignment' | 'Exam'.
 * @param {number} count - Number of questions/tasks.
 * @returns {Promise<Object>} The generated content.
 */
export const generateAssessment = async (context, level, type, count = 5) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert professor specialized in educational assessment.
      
      TASK: Generate a ${type} based on the provided course materials and the student's current proficiency level.
      STUDENT LEVEL: ${level}
      ASSESSMENT TYPE: ${type}
      LANGUAGE: ENGLISH ONLY

      COURSE MATERIALS & CONTEXT:
      ${context}

      DIFFICULTY GUIDELINES PER LEVEL:
      - Beginner: Focus on core terminology, basic understanding, and "what" questions.
      - Intermediate: Focus on "how" and "why", scenario-based questions, and practical application.
      - Advanced: Focus on critical analysis, synthesis of multiple concepts, and complex problem-solving.

      ${type === 'Assignment' ? `
      ASSIGNMENT REQUIREMENTS:
      - Create ${count} practical tasks or projects.
      - Each task should have a clear description and specific success criteria.
      - Ensure tasks relate directly to the video lessons and course description mentioned above.
      ` : `
      ${type === 'Exam' ? 'EXAM' : 'QUIZ'} REQUIREMENTS:
      - Generate ${count} multiple-choice questions.
      - Each question must have 4 options and 1 correct answer.
      - The questions should be comprehensive, covering various parts of the course materials.
      - Distractors (wrong options) should be plausible but clearly incorrect.
      `}

      OUTPUT FORMAT (STRICT JSON ONLY):
      If Quiz or Exam:
      {
        "title": "${type} Title",
        "questions": [
          {
            "text": "The question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The exact text of the correct option"
          }
        ]
      }

      If Assignment:
      {
        "title": "Assignment Title",
        "tasks": [
          {
            "description": "Detailed task description based on course material",
            "criteria": "What constitutes a successful submission"
          }
        ]
      }
      
      CRITICAL: Return ONLY the JSON object. Do not include markdown formatting or extra text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON if needed (sometimes Gemini wraps it in markdown)
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error generating assessment:", error);
    throw new Error("Failed to generate assessment with AI");
  }
};
