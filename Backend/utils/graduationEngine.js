import { Enrollment } from "../models/Enrollment.js";
import { Submission } from "../models/Submission.js";
import { ExamResult } from "../models/ExamResult.js";
import { Grade } from "../models/Grade.js";
import { Exam } from "../models/Exam.js";
import mongoose from "mongoose";
import { generateAndUploadCertificate } from "./certificateService.js";

/**
 * Checks if a student is eligible for graduation and certificate.
 */
export const checkGraduationStatus = async (studentId, courseId) => {
  try {
    if (!studentId || !courseId) return;

    // Validate ObjectIds to prevent crashes with truncated/invalid IDs
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(courseId)) {
        console.error(`[GRADUATION-ERROR] Invalid IDs provided: studentId=${studentId}, courseId=${courseId}`);
        return;
    }

    const sId = new mongoose.Types.ObjectId(studentId);
    const cId = new mongoose.Types.ObjectId(courseId);

    const enrollment = await Enrollment.findOne({ studentId: sId, courseId: cId });
    if (!enrollment) return;

    // 0. Check if certificate was revoked/deleted by instructor
    if (enrollment.isRevoked) {
      console.log(`[GRADUATION] Student ${sId} certificate for course ${cId} was revoked. Skipping auto-generation.`);
      return;
    }

    // 1. Check Course Progress (Must be 100%)
    if (enrollment.progress < 100) {
      console.log(`[GRADUATION] Student ${sId} progress is ${enrollment.progress}%, not 100%.`);
      return;
    }

    // 2. Check if the course actually has a published exam
    const courseExam = await Exam.findOne({ courseId: cId, status: "Published" });
    
    let isExamRequirementMet = true;
    let averageScore = 0;

    if (courseExam) {
        // Course has an exam, student MUST have passed it
        const submissionResult = await Submission.aggregate([
            { $match: { studentId: sId, courseId: cId, type: "Exam" } },
            { $group: { _id: null, averageScore: { $avg: "$score" } } }
        ]);

        const examResultData = await ExamResult.findOne({
            studentId: sId,
            courseId: cId
        }).sort({ percentage: -1 });

        const gradeResult = await Grade.findOne({
            studentId: sId,
            courseId: cId,
            type: "Exam"
        }).sort({ percentage: -1 });

        if (submissionResult && submissionResult.length > 0) {
            averageScore = submissionResult[0].averageScore;
        }
        if (examResultData && examResultData.percentage > averageScore) {
            averageScore = examResultData.percentage;
        }
        if (gradeResult && gradeResult.percentage > averageScore) {
            averageScore = gradeResult.percentage;
        }

        enrollment.averageExamScore = Math.round(averageScore || 0);
        
        // If they have no record or score < 70, they haven't met requirements
        if (!submissionResult.length && !gradeResult && !examResultData) {
            isExamRequirementMet = false;
            console.log(`[GRADUATION] Student ${sId} has not taken the required exam for course ${cId}`);
        } else if (averageScore < 70) {
            isExamRequirementMet = false;
            console.log(`[GRADUATION] Student ${sId} exam score ${averageScore}% is below 70%`);
        }
    }

    // 3. Final Eligibility Check
    if (enrollment.progress === 100 && isExamRequirementMet) {
      console.log(`[GRADUATION] Success! Attempting to generate certificate for student ${sId}...`);
      
      try {
          // IMPORTANT: Generate certificate first. If this fails, we don't mark as "Completed" yet
          // so the user/system can retry later.
          const certUrl = await generateAndUploadCertificate(sId, cId);
          
          if (certUrl) {
            enrollment.status = "Completed";
            enrollment.completed = true;
            enrollment.canGenerateCertificate = true;
            await enrollment.save();
            console.log(`[GRADUATION] Certificate generated and enrollment updated for student ${sId}`);
          }
      } catch (certError) {
          console.error("[GRADUATION-CERT-ERROR]:", certError);
          // We still save the enrollment progress/average score even if cert fails
          await enrollment.save();
      }
    } else {
      await enrollment.save();
    }
  } catch (error) {
    console.error("[GRADUATION-ENGINE-ERROR]:", error);
  }
};