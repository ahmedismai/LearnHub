import express from "express";
import { Grade } from "../models/Grade.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get(
  "/me",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const grades = await Grade.find({ studentId: req.user.id })
        .populate("courseId", "title")
        .populate("quizId", "title")
        .sort({ createdAt: -1 });

      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
