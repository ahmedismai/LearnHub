import { Grade } from "../models/Grade.js";
import { ExamResult } from "../models/ExamResult.js";

/**
 * Calculates the student level based on their weighted performance in a specific course.
 * Weights: Exams (50%), Quizzes (30%), Assignments (20%)
 * Also considers recent performance by weighing later results more heavily.
 * 
 * @param {string} studentId 
 * @param {string} courseId 
 * @returns {Promise<string>} 'Beginner' | 'Intermediate' | 'Advanced'
 */
export const calculateStudentLevel = async (studentId, courseId) => {
  try {
    // Fetch all types of assessments
    const [grades, examResults] = await Promise.all([
      Grade.find({ studentId, courseId }).sort({ createdAt: -1 }).lean(),
      ExamResult.find({ studentId, courseId }).sort({ createdAt: -1 }).lean()
    ]);

    const quizzes = grades.filter(g => g.type === "Quiz");
    const assignments = grades.filter(g => g.type === "Assignment");

    const calculateWeightedAverage = (items, limit = 5) => {
      if (items.length === 0) return null;
      
      // Consider up to 'limit' most recent items
      const recentItems = items.slice(0, limit);
      
      // Give more weight to most recent (linearly decreasing)
      let totalWeightedScore = 0;
      let totalWeight = 0;
      
      recentItems.forEach((item, index) => {
        const weight = (limit - index); // Most recent has highest weight
        totalWeightedScore += (item.percentage || item.score || 0) * weight;
        totalWeight += weight;
      });
      
      return totalWeightedScore / totalWeight;
    };

    const examAvg = calculateWeightedAverage(examResults, 3);
    const quizAvg = calculateWeightedAverage(quizzes, 5);
    const assignmentAvg = calculateWeightedAverage(assignments, 5);

    // Final weighted calculation
    let finalScore = 0;
    let weightSum = 0;

    if (examAvg !== null) {
      finalScore += examAvg * 0.5;
      weightSum += 0.5;
    }
    if (quizAvg !== null) {
      finalScore += quizAvg * 0.3;
      weightSum += 0.3;
    }
    if (assignmentAvg !== null) {
      finalScore += assignmentAvg * 0.2;
      weightSum += 0.2;
    }

    if (weightSum === 0) return "Beginner";

    const normalizedScore = finalScore / weightSum;

    if (normalizedScore < 50) return "Beginner";
    if (normalizedScore < 80) return "Intermediate";
    return "Advanced";
  } catch (error) {
    console.error("Error calculating student level:", error);
    return "Beginner";
  }
};
