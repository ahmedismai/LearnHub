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
    // ONE-TIME PURGE: Remove old corrupted data with null IDs
    // This helps resolve index conflicts from previous failed attempts
    await Grade.deleteMany({
      $or: [
        { quizId: null },
        { examId: null },
        { assignmentId: null }
      ]
    });

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    const filter = { studentId };
    // Only include IDs that are truthy (not null/undefined)
    if (quizId) filter.quizId = quizId;
    else if (examId) filter.examId = examId;
    else if (assignmentId) filter.assignmentId = assignmentId;

    // Use a clean update object
    const updateData = {
      studentId,
      courseId,
      type,
      score,
      maxScore,
      percentage,
    };

    // Explicitly set IDs ONLY if they have values, otherwise leave them undefined
    if (quizId) updateData.quizId = quizId;
    if (examId) updateData.examId = examId;
    if (assignmentId) updateData.assignmentId = assignmentId;

    if (aiFeedback !== undefined) updateData.aiFeedback = aiFeedback;
    if (isReviewed !== undefined) updateData.isReviewed = isReviewed;

    console.log(`[GRADE-UPDATER]: Filter for student ${studentId}:`, JSON.stringify(filter));
    console.log(`[GRADE-UPDATER]: Update data:`, JSON.stringify(updateData));

    const grade = await Grade.findOneAndUpdate(
      filter,
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return grade;
  } catch (error) {
    console.error("[UPDATE-GRADE-ERROR]:", error);
    throw error;
  }
};
