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
      
      // 1. Proactive Graduation Check (Only if not already processed)
      const potentialEnrollments = await Enrollment.find({
        studentId,
        progress: 100,
        status: "Active" // Only check those not yet marked completed
      });

      for (const enrollment of potentialEnrollments) {
        const courseId = enrollment.courseId._id || enrollment.courseId;
        await checkGraduationStatus(studentId, courseId);
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

router.get(
  "/instructor",
  protect,
  authorize(ROLES.INSTRUCTOR),
  async (req, res) => {
    try {
      const instructorId = req.user.id;
      
      // Find courses by this instructor
      const instructorCourses = await Course.find({ instructorId }).select("_id");
      const courseIds = instructorCourses.map(c => c._id);

      if (courseIds.length === 0) {
        return res.json([]);
      }

      // No more aggressive auto-generation here to avoid "zombie" certificates
      // Certificates will be fetched as they exist in the DB

      const certificates = await Certificate.find({ courseId: { $in: courseIds } })
        .populate("studentId", "name email")
        .populate("courseId", "title")
        .sort({ issueDate: -1 });
        
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/all",
  protect,
  authorize(ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const certificates = await Certificate.find()
        .populate("studentId", "name email")
        .populate("courseId", "title")
        .sort({ issueDate: -1 });
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete(
  "/:id",
  protect,
  authorize(ROLES.ADMINISTRATOR, ROLES.INSTRUCTOR),
  async (req, res) => {
    try {
      console.log(`[DELETE-CERT] Attempting to delete certificate: ${req.params.id}`);
      
      const certificate = await Certificate.findById(req.params.id).populate("courseId");
      if (!certificate) {
        console.log(`[DELETE-CERT] Certificate not found: ${req.params.id}`);
        return res.status(404).json({ message: "Certificate not found" });
      }

      // If instructor, verify they own the course
      if (req.user.role === ROLES.INSTRUCTOR) {
        if (!certificate.courseId) {
          console.log(`[DELETE-CERT] Course missing for cert ${req.params.id}`);
          return res.status(400).json({ message: "Course data is missing for this certificate." });
        }

        const courseInstructorId = certificate.courseId.instructorId?.toString();
        if (courseInstructorId !== req.user.id) {
          console.log(`[DELETE-CERT] Unauthorized: Instructor ${req.user.id} does not own course ${certificate.courseId._id}`);
          return res.status(403).json({ message: "You can only delete certificates for your own courses" });
        }
      }

      // Reset enrollment status so it doesn't auto-regenerate
      const studentId = certificate.studentId;
      const courseId = certificate.courseId._id || certificate.courseId;
      
      const updatedEnrollment = await Enrollment.findOneAndUpdate(
        { studentId, courseId },
        { 
          completed: false, 
          canGenerateCertificate: false,
          isRevoked: true,
          status: "Active" 
        },
        { new: true }
      );

      if (updatedEnrollment) {
        console.log(`[DELETE-CERT] Enrollment updated for student ${studentId} in course ${courseId}`);
      } else {
        console.warn(`[DELETE-CERT] Warning: No enrollment found to reset for student ${studentId} in course ${courseId}`);
      }

      await Certificate.findByIdAndDelete(req.params.id);
      console.log(`[DELETE-CERT] Certificate ${req.params.id} successfully deleted from database`);
      
      res.json({ message: "Certificate deleted successfully" });
    } catch (error) {
      console.error("[DELETE-CERTIFICATE-ERROR]:", error);
      res.status(500).json({ message: "Server error during certificate deletion" });
    }
  }
);

router.post(
  "/generate",
  protect,
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