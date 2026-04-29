import express from "express";
import { chatWithAI } from "../utils/aiService.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route POST /api/Chatbot/message
 * @desc General chat with AI tutor
 */
router.post("/message", protect, async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const response = await chatWithAI(message, history || []);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ message: "Failed to get AI response", error: error.message });
  }
});

export default router;
