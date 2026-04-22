import { Grade } from "../models/Grade.js";

/**
 * Updates or creates a grade entry for a student's assessment.
 * @param {Object} params
 * @param {string} params.studentId
 * @param {string} params.courseId
 * @param {string} [params.quizId]
 * @param {string} [params.examId]
 * @param {string} [params.assignmentId]
 * @param {string} params.type - "Quiz", "Exam", or "Assignment"
 * @param {number} params.score
 * @param {number} params.maxScore
 */
export const updateGrade = async ({
  studentId,
  courseId,
  quizId,
  examId,
  assignmentId,
  type,
  score,
  maxScore,
  aiFeedback,
  isReviewed,
}) => {
  try {
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    const filter = { studentId };
    if (quizId) filter.quizId = quizId;
    if (examId) filter.examId = examId;
    if (assignmentId) filter.assignmentId = assignmentId;

    const update = {
      studentId,
      courseId,
      quizId,
      examId,
      assignmentId,
      type,
      score,
      maxScore,
      percentage,
    };

    if (aiFeedback !== undefined) update.aiFeedback = aiFeedback;
    if (isReviewed !== undefined) update.isReviewed = isReviewed;

    const grade = await Grade.findOneAndUpdate(
      filter,
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return grade;
  } catch (error) {
    console.error("[UPDATE-GRADE-ERROR]:", error);
    throw error;
  }
};
