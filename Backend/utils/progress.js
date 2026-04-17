import { Content } from "../models/Content.js";

export const updateEnrollmentProgress = async (enrollment) => {
  await enrollment.populate("courseId");
  const course = enrollment.courseId;

  // Total lessons in course
  const courseLessons = await Content.find({ courseId: course._id, contentType: 'Lesson' }).select("_id");
  const totalLessons = courseLessons.length;
  const lessonProgress =
    totalLessons > 0
      ? ((enrollment.completedLessons || []).length / totalLessons) * 100
      : 100;

  const courseQuizzes = await Content.find({ courseId: course._id, contentType: 'Quiz' }).select("_id");
  const totalQuizzes = courseQuizzes.length;
  const quizProgress =
    totalQuizzes > 0
      ? ((enrollment.completedQuizzes || []).length / totalQuizzes) * 100
      : 100;

  const courseAssignments = await Content.find({ courseId: course._id, contentType: 'Assignment' }).select("_id");
  const totalAssignments = courseAssignments.length;
  const assignmentProgress =
    totalAssignments > 0
      ? ((enrollment.completedAssignments || []).length / totalAssignments) * 100
      : 100;

  enrollment.progress = Math.min(
    100,
    Math.round((lessonProgress * 0.4) + (quizProgress * 0.3) + (assignmentProgress * 0.3))
  );
  
  enrollment.completed =
    (enrollment.completedLessons || []).length === totalLessons &&
    (enrollment.completedQuizzes || []).length === totalQuizzes &&
    (enrollment.completedAssignments || []).length === totalAssignments;

  await enrollment.save();
  return enrollment;
};