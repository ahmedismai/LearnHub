import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message is required" });
    }

    const prompt = message.trim().toLowerCase();
    let answer =
      "I can help you with courses, enrollment, exams, and platform navigation.";

    if (prompt.includes("hello") || prompt.includes("hi")) {
      answer = "Hello! How can I help you learn today?";
    } else if (prompt.includes("course")) {
      answer =
        "You can browse courses, enroll in classes, and check your progress on the dashboard.";
    } else if (prompt.includes("enroll")) {
      answer =
        "To enroll, use the enrollment endpoint with the course ID and your payment method.";
    } else if (prompt.includes("exam") || prompt.includes("quiz")) {
      answer =
        "You can start an exam using the exam endpoint and submit answers through the exam result API.";
    }

    res.json({ message, answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
