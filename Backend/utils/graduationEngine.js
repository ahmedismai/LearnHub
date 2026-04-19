import { Enrollment } from "../models/Enrollment.js";
import { Submission } from "../models/Submission.js";

/**
 * Checks if a student is eligible for graduation and certificate.
 * Triggered after every exam submission.
 */
export const checkGraduationStatus = async (studentId, courseId) => {
  try {
    const enrollment = await Enrollment.findOne({ studentId, courseId });
    if (!enrollment) return;

    // 1. Check Course Progress (Must be 100%)
    if (enrollment.progress < 100) {
      console.log(`[GRADUATION] Student ${studentId} progress is ${enrollment.progress}%, not 100%.`);
      return;
    }

    // 2. Check Average Exam Score (Must be >= 70%)
    const submissions = await Submission.find({ 
      studentId, 
      courseId, 
      type: "Exam" 
    });

    if (submissions.length === 0) {
      console.log(`[GRADUATION] Student ${studentId} has no exam submissions.`);
      return;
    }

    const totalScore = submissions.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = totalScore / submissions.length;

    // Update the record with the latest average
    enrollment.averageExamScore = Math.round(averageScore);

    if (averageScore >= 70) {
      enrollment.status = "Completed";
      enrollment.completed = true;
      enrollment.canGenerateCertificate = true;
      console.log(`[GRADUATION] Success! Student ${studentId} is eligible for certificate in course ${courseId}`);
    } else {
      console.log(`[GRADUATION] Average score ${averageScore}% is below threshold.`);
    }

    await enrollment.save();
  } catch (error) {
    console.error("[GRADUATION-ENGINE-ERROR]:", error);
  }
};
