import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Hardened Gemini interaction service with defensive parsing
 */
export const generateAssessment = async (context, level, type, count = 5) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[CRITICAL] GEMINI_API_KEY is not defined in environment.");
      throw new Error("AI configuration missing on server.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      System: You are an expert academic professor specialized in ${type} design.
      
      Context:
      ${context}

      Task: Generate a ${type} in ENGLISH for a student at the ${level} proficiency level.
      Quantity: ${count} items.

      Output Requirements:
      1. Format: STRICT JSON ONLY.
      2. Content: Questions/Tasks must be directly derived from the provided Context.
      3. Language: ALL output must be in English.

      Expected JSON Structure (Quiz/Exam):
      {
        "title": "Clear English Title",
        "questions": [
          {
            "text": "The question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The exact text of the correct option"
          }
        ]
      }

      Expected JSON Structure (Assignment):
      {
        "title": "Clear English Title",
        "tasks": [
          {
            "description": "Specific task instruction",
            "criteria": "Success metrics"
          }
        ]
      }

      Important: Return ONLY the raw JSON object. Do not include markdown blocks or conversational text.
    `;

    console.log(
      `[AI-LOG] Sending Context to Gemini (${context.length} chars)...`,
    );

    const result = await model.generateContent(prompt);

    if (!result || !result.response) {
      throw new Error("Gemini API returned an empty or invalid response.");
    }

    const rawText = result.response.text();
    console.log("[AI-LOG] Raw Response Received from Gemini.");

    // Defensive Sanitization: Find the first { and last } to extract JSON
    const startIdx = rawText.indexOf("{");
    const endIdx = rawText.lastIndexOf("}");

    if (startIdx === -1 || endIdx === -1) {
      console.error("[AI-LOG] Invalid AI Output Format. Raw text:", rawText);
      throw new Error("AI response did not contain a valid JSON object.");
    }

    const sanitizedJson = rawText.substring(startIdx, endIdx + 1);

    try {
      return JSON.parse(sanitizedJson);
    } catch (parseError) {
      console.error(
        "[AI-LOG] JSON Parse Error. Sanitized String:",
        sanitizedJson,
      );
      throw new Error("Failed to parse AI output as JSON.");
    }
  } catch (error) {
    console.error("[AI-SERVICE-ERROR]:", error.message);
    throw error;
  }
};

/**
 * Generates encouraging and educational feedback for assessments
 */
export const generateFeedback = async (assessmentType, assessmentData, submissionData) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI configuration missing.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = "";

    if (assessmentType === "Quiz" || assessmentType === "Exam") {
      const wrongAnswers = submissionData.answers.filter(a => !a.isCorrect);
      
      if (wrongAnswers.length === 0) {
        prompt = `
          The student scored 100% on a ${assessmentType} titled "${assessmentData.title}".
          Write a short, highly encouraging, and professional praise for their perfect score.
          Keep it educational and briefly mention the importance of mastering these topics.
        `;
      } else {
        // Map wrong answers to their questions if possible
        // We need the question text and correct answer text
        const analysisData = wrongAnswers.map(wa => {
           const question = assessmentData.questions.find(q => q._id.toString() === wa.questionId || q.text === wa.text);
           return {
             question: question?.text || wa.questionId,
             studentChoice: wa.selectedOption,
             correctAnswer: question?.correctAnswer || "The correct one"
           };
        });

        prompt = `
          System: You are an encouraging AI Tutor. 
          Task: Analyze the student's wrong answers in a ${assessmentType} titled "${assessmentData.title}".
          
          Data:
          ${JSON.stringify(analysisData)}

          Instructions:
          1. For each wrong answer, explain WHY the student's choice might be wrong (logic gap).
          2. Explain the logic behind the correct answer clearly.
          3. Tone: Encouraging, professional, and educational.
          4. Format: Plain text with clear sections.
        `;
      }
    } else if (assessmentType === "Assignment") {
      prompt = `
        System: You are a professional AI Tutor evaluating an Assignment.
        
        Instructions for the Assignment:
        ${assessmentData.description}

        Student Submission (Text or Context):
        ${submissionData.submittedFile || "Submitted as a file/external link."}

        Task: Provide feedback based on the instructions.
        Format:
        - Positives: What the student did well.
        - Gaps: What was missing according to the instructions.
        - Growth Tip: Specific advice to improve their skill.
        
        Tone: Encouraging, professional, and educational.
      `;
    }

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("[AI-FEEDBACK-ERROR]:", error.message);
    return "I'm sorry, I couldn't generate feedback at this time. Keep up the great work!";
  }
};
