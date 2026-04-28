import { Enrollment } from "../models/Enrollment.js";
import { Submission } from "../models/Submission.js";
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

    const sId = typeof studentId === "string" ? new mongoose.Types.ObjectId(studentId) : studentId;
    const cId = typeof courseId === "string" ? new mongoose.Types.ObjectId(courseId) : courseId;

    const enrollment = await Enrollment.findOne({ studentId: sId, courseId: cId });
    if (!enrollment) return;

    // 1. Check Course Progress (Must be 100%)
    if (enrollment.progress < 100) {
      console.log(`[GRADUATION] Student \${sId} progress is \${enrollment.progress}%, not 100%.`);
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

        const gradeResult = await Grade.findOne({
            studentId: sId,
            courseId: cId,
            type: "Exam"
        }).sort({ percentage: -1 });

        if (submissionResult && submissionResult.length > 0) {
            averageScore = submissionResult[0].averageScore;
        }
        if (gradeResult && gradeResult.percentage > averageScore) {
            averageScore = gradeResult.percentage;
        }

        enrollment.averageExamScore = Math.round(averageScore || 0);
        
        // If they have no record or score < 70, they haven't met requirements
        if (!submissionResult.length && !gradeResult) {
            isExamRequirementMet = false;
            console.log(`[GRADUATION] Student \${sId} has not taken the required exam for course \${cId}`);
        } else if (averageScore < 70) {
            isExamRequirementMet = false;
            console.log(`[GRADUATION] Student \${sId} exam score \${averageScore}% is below 70%`);
        }
    }

    // 3. Final Eligibility Check
    if (enrollment.progress === 100 && isExamRequirementMet) {
      console.log(`[GRADUATION] Success! Generating certificate for student \${sId}...`);
      
      enrollment.status = "Completed";
      enrollment.completed = true;
      enrollment.canGenerateCertificate = true;
      await enrollment.save();
      
      try {
          await generateAndUploadCertificate(sId, cId);
      } catch (certError) {
          console.error("[GRADUATION-CERT-ERROR]:", certError);
      }
    } else {
      await enrollment.save();
    }
  } catch (error) {
    console.error("[GRADUATION-ENGINE-ERROR]:", error);
  }
};