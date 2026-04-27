import { Enrollment } from "../models/Enrollment.js";
import { Submission } from "../models/Submission.js";
import mongoose from "mongoose";

/**
 * Checks if a student is eligible for graduation and certificate.
 * Triggered after every exam submission.
 */
export const checkGraduationStatus = async (studentId, courseId) => {
  try {
    if (!studentId || !courseId) return;

    const enrollment = await Enrollment.findOne({ studentId, courseId });
    if (!enrollment) return;

    // 1. Check Course Progress (Must be 100%)
    if (enrollment.progress < 100) {
      console.log(`[GRADUATION] Student \${studentId} progress is \${enrollment.progress}%, not 100%.`);
      return;
    }

    // Convert strings to ObjectIds safely for aggregation
    const sId = typeof studentId === "string" ? new mongoose.Types.ObjectId(studentId) : studentId;
    const cId = typeof courseId === "string" ? new mongoose.Types.ObjectId(courseId) : courseId;

    // 2. Check Average Exam Score (Must be >= 70%) using aggregation for efficiency
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

    if (!result || result.length === 0) {
      console.log(`[GRADUATION] Student \${studentId} has no exam submissions.`);
      return;
    }

    const { averageScore } = result[0];

    // Update the record with the latest average
    enrollment.averageExamScore = Math.round(averageScore || 0);

    if (averageScore >= 70) {
      enrollment.status = "Completed";
      enrollment.completed = true;
      enrollment.canGenerateCertificate = true;
      console.log(`[GRADUATION] Success! Student \${studentId} is eligible for certificate in course \${courseId}`);
    } else {
      console.log(`[GRADUATION] Average score \${averageScore}% is below threshold.`);
    }

    await enrollment.save();
  } catch (error) {
    console.error("[GRADUATION-ENGINE-ERROR]:", error);
  }
};