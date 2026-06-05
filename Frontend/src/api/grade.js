import api from "./axios";
import { normalizeList } from "./adapters";

const normalizeGrade = (grade = {}) => ({
  ...grade,
  id: grade.gradeId || grade.id || grade._id,
  gradeId: grade.gradeId || grade.id || grade._id,
  studentId: grade.studentId?._id || grade.studentId?.id || grade.studentId,
  studentName:
    grade.studentName || grade.studentId?.name || grade.studentId?.fullName,
  email: grade.email || grade.studentId?.email,
  courseId: grade.courseId?._id || grade.courseId?.id || grade.courseId,
  courseTitle: grade.courseTitle || grade.courseId?.title,
  examId: grade.examId?._id || grade.examId?.id || grade.examId,
  examTitle:
    grade.examTitle ||
    grade.examId?.title ||
    grade.quizId?.title ||
    grade.assignmentId?.title ||
    `${grade.type || "Assessment"} Assessment`,
  score: grade.percentage ?? grade.score,
  percentage: grade.percentage ?? grade.score,
});

const gradeService = {
  getInstructorGrades: async (courseId) => {
    const params = {};
    if (courseId && courseId !== "undefined" && courseId !== "null") {
      params.courseId = courseId;
    }

    const response = await api.get("/api/Grade/Instructor/AllGrades", {
      params,
    });
    return normalizeList(response.data, normalizeGrade);
  },

  getAdminGrades: async () => {
    const response = await api.get("/api/Grade/Admin/AllGrades");
    return normalizeList(response.data, normalizeGrade);
  },
};

export default gradeService;
