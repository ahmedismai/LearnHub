import { Enrollment } from "../models/Enrollment.js";
import { Submission } from "../models/Submission.js";
import mongoose from "mongoose";
import { generateAndUploadCertificate } from "./certificateService.js";

/**
 * Checks if a student is eligible for graduation and certificate.
 * Triggered after exam submissions, assignment grading, or quiz completion.
 */
export const checkGraduationStatus = async (studentId, courseId) => {
  try {
    if (!studentId || !courseId) return;

    const enrollment = await Enrollment.findOne({ studentId, courseId });
    if (!enrollment) return;

    // 1. Check Course Progress (Must be 100%)
    // Progress includes Lessons, Quizzes, and Assignments (from progress.js)
    if (enrollment.progress < 100) {
      console.log(`[GRADUATION] Student \${studentId} progress is \${enrollment.progress}%, not 100%.`);
      return;
    }

    // Convert strings to ObjectIds safely for aggregation
    const sId = typeof studentId === "string" ? new mongoose.Types.ObjectId(studentId) : studentId;
    const cId = typeof courseId === "string" ? new mongoose.Types.ObjectId(courseId) : courseId;

    // 2. Check Average Exam Score (Must be >= 70%)
    const result = await Submission.aggregate([
      { 
        $match: { 
          studentId: sId, 
          courseId: cId, 
          type: "Exam" 
        } 
      },
      { 
        $group: { 
          _id: null, 
          averageScore: { $avg: "$score" },
          count: { $sum: 1 }
        } 
      }
    ]);

    // If exams exist, check score. If no exams in course, proceed if progress is 100%
    let averageScore = 0;
    if (result && result.length > 0) {
      averageScore = result[0].averageScore;
      enrollment.averageExamScore = Math.round(averageScore || 0);
    }

    // 3. Final Eligibility Check
    // Threshold: 100% progress AND (no exam OR average score >= 70)
    if (enrollment.progress === 100 && (result.length === 0 || averageScore >= 70)) {
      enrollment.status = "Completed";
      enrollment.completed = true;
      enrollment.canGenerateCertificate = true;
      
      console.log(`[GRADUATION] Success! Generating certificate for student \${studentId}...`);
      
      // Automatic Generation and Cloudinary Upload
      const certificateUrl = await generateAndUploadCertificate(studentId, courseId);
      
      console.log(`[GRADUATION] Certificate generated: \${certificateUrl}`);
    } else {
      console.log(`[GRADUATION] Requirements not met. Progress: \${enrollment.progress}%, Score: \${averageScore}%`);
    }

    await enrollment.save();
  } catch (error) {
    console.error("[GRADUATION-ENGINE-ERROR]:", error);
  }
};