import express from "express";
import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";
import { Content } from "../models/Content.js";
import { Grade } from "../models/Grade.js";
import { Certificate } from "../models/Certificate.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get(
  "/",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const certificates = await Certificate.find({ studentId: req.user.id })
        .populate("courseId", "title")
        .sort({ issueDate: -1 });
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const { courseId } = req.body;
      const enrollment = await Enrollment.findOne({ studentId: req.user.id, courseId });
      
      if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

      if (enrollment.progress < 100) {
        return res.status(400).json({ message: "Course not completed yet" });
      }

      const certificateUrl = `/api/certificates/download/${courseId}`;
      const certificate = await Certificate.findOneAndUpdate(
        { studentId: req.user.id, courseId },
        { studentId: req.user.id, courseId, issueDate: new Date(), certificateUrl },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.status(201).json({ message: "Certificate generated", certificate });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;