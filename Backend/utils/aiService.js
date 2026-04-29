import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { z } from "zod";
import pRetry from "p-retry";

dotenv.config();

// Define Zod schemas for validation
const QuizSchema = z.object({
  title: z.string(),
  questions: z
    .array(
      z.object({
        text: z.string(),
        options: z.array(z.string()).min(2),
        correctAnswer: z.string(),
      }),
    )
    .min(1),
});

const AssignmentSchema = z.object({
  title: z.string(),
  tasks: z
    .array(
      z.object({
        description: z.string(),
        criteria: z.string(),
      }),
    )
    .min(1),
});

const AI_MODEL = "gemini-2.5-flash";
const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT) || 30000; // 30 seconds

/**
 * Hardened Gemini interaction service with defensive parsing, retry logic, and validation.
 */
export const generateAssessment = async (context, level, type, count = 5) => {
  // ... (omitted for brevity in thoughts, but I will provide full code)
  const runAction = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("AI configuration missing on server.");
    }

    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1" });
    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      System: You are an expert academic professor specialized in ${type} design.
      
      Context:
      ${context}

      Task: Generate ${count} questions. Mix Multiple Choice and True/False questions based on the context. Ensure the JSON structure remains consistent, where True/False questions have only two options: ["True", "False"].
      
      Target Audience: Student at the ${level} proficiency level.

      Output Requirements:
      1. Format: STRICT JSON ONLY.
      2. Quantity: Exactly ${count} questions/tasks.
      3. Language: ALL output must be in English.

      Expected JSON Structure (Quiz/Exam):
      {
        "title": "Clear English Title",
        "questions": [
          {
            "text": "The question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The exact text of the correct option"
          },
          {
            "text": "Statement to evaluate as True or False?",
            "options": ["True", "False"],
            "correctAnswer": "True"
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
    `;

    // Implement timeout using AbortController if supported by the client,
    // but the library might not support it directly in generateContent.
    // We'll wrap it in a Promise for timeout.
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI_TIMEOUT")), AI_TIMEOUT),
    );

    const resultPromise = model.generateContent(prompt);

    const result = await Promise.race([resultPromise, timeoutPromise]);

    if (!result || !result.response) {
      throw new Error("Gemini API returned an empty or invalid response.");
    }

    const rawText = result.response.text();

    // Defensive Sanitization
    const startIdx = rawText.indexOf("{");
    const endIdx = rawText.lastIndexOf("}");

    if (startIdx === -1 || endIdx === -1) {
      throw new Error("AI response did not contain a valid JSON object.");
    }

    const sanitizedJson = rawText.substring(startIdx, endIdx + 1);
    const parsedData = JSON.parse(sanitizedJson);

    // Validate with Zod
    if (type === "Assignment") {
      return AssignmentSchema.parse(parsedData);
    } else {
      return QuizSchema.parse(parsedData);
    }
  };

  return pRetry(runAction, {
    retries: 2,
    onFailedAttempt: (error) => {
      console.warn(
        `[AI-RETRY] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
      );
    },
  });
};

/**
 * General purpose chatbot with academic integrity guardrails.
 */
export const chatWithAI = async (message, history = []) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI configuration missing.");

    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1" });

    const systemContext = `
      You are LearnHub AI, a helpful educational assistant.
      
      RULES:
      1. You can answer general questions, explain concepts, and help with coding/study tips.
      2. IMPORTANT: NEVER provide direct answers, solutions, or full code for active Exams, Quizzes, or Assignments on this platform.
      3. If a user asks for help with a specific test question, refuse politely and offer to explain the UNDERLYING CONCEPT instead.
      4. Keep responses professional, concise, and encouraging.
      5. Language: Answer in the same language as the user's message.
    `;

    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      systemInstruction: systemContext,
    });

    // Filter and sanitize history:
    // 1. Must start with 'user'
    // 2. Must alternate between 'user' and 'model'
    // 3. Must end with 'model' (since sendMessage will append a 'user' turn)
    let sanitizedHistory = [];
    let lastRole = null;

    for (const h of history) {
      const currentRole = h.role === "user" ? "user" : "model";

      // Skip if it doesn't start with user
      if (sanitizedHistory.length === 0 && currentRole !== "user") continue;

      // Skip consecutive same-role messages
      if (currentRole === lastRole) continue;

      sanitizedHistory.push({
        role: currentRole,
        parts: [{ text: h.content }],
      });
      lastRole = currentRole;
    }

    // Ensure it ends with 'model' for sendMessage to work correctly
    if (
      sanitizedHistory.length > 0 &&
      sanitizedHistory[sanitizedHistory.length - 1].role !== "model"
    ) {
      sanitizedHistory.pop();
    }

    const chat = model.startChat({
      history: sanitizedHistory,
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("[AI-CHAT-ERROR]:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
};

/**
 * Evaluates a code submission (HTML/CSS) using the specialized Arabic prompt.
 */
export const evaluateCodeAssignment = async (fileContent) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI configuration missing.");

    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1" });
    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `Review this HTML/CSS code: ${fileContent}. Return ONLY a JSON object in this format: {"score": 100, "status": "Accepted", "feedback": "brief message"}. Evaluate the score based on code quality and fulfillment of requirements.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Defensive Sanitization
    const startIdx = responseText.indexOf("{");
    const endIdx = responseText.lastIndexOf("}");

    if (startIdx === -1 || endIdx === -1) {
      throw new Error("AI response did not contain a valid JSON object.");
    }

    const sanitizedJson = responseText.substring(startIdx, endIdx + 1);
    return JSON.parse(sanitizedJson);
  } catch (error) {
    console.error("[AI-CODE-EVALUATION-ERROR]:", error);
    return {
      score: 0,
      status: "Error",
      feedback: "Automatic evaluation failed. Please try again later.",
    };
  }
};

/**
 * Generates encouraging and educational feedback for assessments
 */
export const generateFeedback = async (
  assessmentType,
  assessmentData,
  submissionData,
) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI configuration missing.");

    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1" });
    const model = genAI.getGenerativeModel({ model: AI_MODEL });

    let prompt = "";

    if (assessmentType === "Quiz" || assessmentType === "Exam") {
      const wrongAnswers = (submissionData.answers || []).filter(
        (a) => !a.isCorrect,
      );

      if (wrongAnswers.length === 0 && submissionData.score >= 100) {
        prompt = `
          The student scored 100% on a ${assessmentType} titled "${assessmentData.title}".
          Write a short, highly encouraging, and professional praise for their perfect score.
          Keep it educational and briefly mention the importance of mastering these topics.
        `;
      } else {
        const analysisData = wrongAnswers.map((wa) => {
          const question = (assessmentData.questions || []).find(
            (q) =>
              (q._id && q._id.toString() === wa.questionId) ||
              q.text === wa.text,
          );
          return {
            question: question?.text || wa.questionId || "Unknown Question",
            studentChoice: wa.selectedOption,
            correctAnswer: question?.correctAnswer || "The correct answer",
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
        ${assessmentData.description || assessmentData.title}

        Student Submission (Text or Context):
        ${submissionData.submittedFile || submissionData.text || "Submitted work."}

        Task: Provide feedback based on the instructions.
        Format:
        - Positives: What the student did well.
        - Gaps: What was missing according to the instructions.
        - Growth Tip: Specific advice to improve their skill.
        
        Tone: Encouraging, professional, and educational.
      `;
    }

    if (!prompt) return "Great job on completing your assessment!";

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Ensure feedback is returned as a clean string for JSON response
    return responseText.trim();
  } catch (error) {
    // Log the ACTUAL error for server-side debugging (Quota, API Key, etc.)
    console.error("[AI-FEEDBACK-ERROR-DETAIL]:", {
      message: error.message,
      stack: error.stack,
      assessmentType,
    });

    // Return a slightly more informative but safe message
    return `Note: AI feedback is temporarily unavailable (${error.message.includes("Quota") ? "Rate limit reached" : "Service error"}). Please check back later.`;
  }
};
