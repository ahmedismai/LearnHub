import express from "express";
import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";
import { Content } from "../models/Content.js";
import { Grade } from "../models/Grade.js";
import { Certificate } from "../models/Certificate.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

import { checkGraduationStatus } from "../utils/graduationEngine.js";
import { generateAndUploadCertificate } from "../utils/certificateService.js";

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
  "/generate",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const { courseId } = req.body;
      const studentId = req.user.id;

      // First check eligibility
      await checkGraduationStatus(studentId, courseId);

      const enrollment = await Enrollment.findOne({ studentId, courseId });
      if (!enrollment || !enrollment.canGenerateCertificate) {
        return res.status(400).json({ 
          message: "You are not eligible for a certificate yet. Ensure progress is 100% and exam score is >= 70%." 
        });
      }

      const certificateUrl = await generateAndUploadCertificate(studentId, courseId);

      res.status(201).json({ 
        message: "Certificate generated successfully", 
        certificateUrl 
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;