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
  async (req, res) => {
    try {
      const studentId = req.user.id;
      
      // 1. Proactive Graduation Check (Self-Repair)
      // Look for any enrollments that have 100% progress but might have missed the graduation trigger
      const potentialEnrollments = await Enrollment.find({
        studentId,
        progress: 100,
        status: { $ne: "Cancelled" }
      });

      for (const enrollment of potentialEnrollments) {
        const courseId = enrollment.courseId._id || enrollment.courseId;
        
        // If not marked as completed or can't generate cert, try to run the graduation check
        if (!enrollment.completed || !enrollment.canGenerateCertificate) {
            console.log(`[CERT-PROACTIVE] Running graduation check for course ${courseId}...`);
            await checkGraduationStatus(studentId, courseId);
        } else {
            // If marked as eligible but certificate document is missing, generate it
            const certExists = await Certificate.findOne({ studentId, courseId });
            if (!certExists) {
                console.log(`[CERT-REPAIR] Missing certificate document for course ${courseId}. Generating now...`);
                try {
                    await generateAndUploadCertificate(studentId, courseId);
                } catch (err) {
                    console.error(`[CERT-REPAIR-ERROR] Course ${courseId}:`, err);
                }
            }
        }
      }

      // 2. Return all certificates
      const certificates = await Certificate.find({ studentId })
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