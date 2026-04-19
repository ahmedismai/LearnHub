import { Grade } from "../models/Grade.js";
import { ExamResult } from "../models/ExamResult.js";

/**
 * Calculates the student level based on their grades and exam results for a specific course.
 * @param {string} studentId 
 * @param {string} courseId 
 * @returns {Promise<string>} 'Beginner' | 'Intermediate' | 'Advanced'
 */
export const calculateStudentLevel = async (studentId, courseId) => {
  try {
    const grades = await Grade.find({ studentId, courseId });
    const examResults = await ExamResult.find({ studentId, courseId });

    const allPercentages = [
      ...grades.map(g => g.percentage),
      ...examResults.map(e => e.percentage)
    ];

    if (allPercentages.length === 0) {
      return "Beginner"; // Default level if no assessments yet
    }

    const average = allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length;

    if (average < 50) return "Beginner";
    if (average < 80) return "Intermediate";
    return "Advanced";
  } catch (error) {
    console.error("Error calculating student level:", error);
    return "Beginner";
  }
};
