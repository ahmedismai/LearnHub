import { Content } from "../models/Content.js";
import { checkGraduationStatus } from "./graduationEngine.js";

export const updateEnrollmentProgress = async (enrollment) => {
  try {
    if (!enrollment) return;
    
    await enrollment.populate("courseId");
    const course = enrollment.courseId;

    if (!course) {
      console.error(`[PROGRESS-ERROR] Course not found for enrollment \${enrollment._id}`);
      return enrollment;
    }

    const courseId = course._id;

    // Total lessons in course
    const courseLessons = await Content.find({ courseId, contentType: 'Lesson' }).select("_id");
    const totalLessons = courseLessons.length;
    const lessonProgress =
      totalLessons > 0
        ? ((enrollment.completedLessons || []).length / totalLessons) * 100
        : 100;

    const courseQuizzes = await Content.find({ courseId, contentType: 'Quiz' }).select("_id");
    const totalQuizzes = courseQuizzes.length;
    const quizProgress =
      totalQuizzes > 0
        ? ((enrollment.completedQuizzes || []).length / totalQuizzes) * 100
        : 100;

    const courseAssignments = await Content.find({ courseId, contentType: 'Assignment' }).select("_id");
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

    // TRIGGER AUTOMATIC GRADUATION CHECK
    if (enrollment.progress === 100) {
        // We use setImmediate to not block the current request while generating PDF/Uploading to Cloudinary
        setImmediate(async () => {
            try {
                await checkGraduationStatus(enrollment.studentId, enrollment.courseId);
            } catch (err) {
                console.error("[AUTO-GRADUATION-TRIGGER-ERROR]:", err);
            }
        });
    }

    return enrollment;
  } catch (error) {
    console.error("[UPDATE-PROGRESS-ERROR]:", error);
    return enrollment;
  }
};