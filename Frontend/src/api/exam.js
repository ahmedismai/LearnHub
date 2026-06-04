import api from "./axios";
import { normalizeExam, normalizeList, normalizeResult, wrapData } from "./adapters";

const isValidId = (id) =>
  id !== undefined && id !== null && id !== "" && id !== "undefined" && id !== "null";

export const examService = {
  // --- Exam Controller Endpoints ---

  getAll: async () => {
    const response = await api.get("/api/Exam");
    return normalizeList(response.data, normalizeExam);
  },

  create: async (examData) => {
    const response = await api.post("/api/Exam", examData);
    return wrapData(normalizeExam(response.data));
  },

  getByCourse: async (courseId) => {
    if (!isValidId(courseId)) return { data: [] };
    const response = await api.get(`/api/Exam/ByCourse/${courseId}`);
    return normalizeList(response.data, normalizeExam);
  },

  delete: async (examId) => {
    const response = await api.delete(`/api/Exam/${examId}`);
    return response.data;
  },

  update: async (examId, examData) => {
    const response = await api.patch(`/api/Exam/${examId}`, examData);
    return wrapData(normalizeExam(response.data));
  },

  getDetails: async (examId) => {
    const response = await api.get(`/api/Exam/Details/${examId}`);
    return wrapData(normalizeExam(response.data));
  },

  startExam: async (examId) => {
    const response = await api.post(`/api/Exam/StartExam/${examId}`);
    return wrapData(normalizeExam(response.data));
  },

  generateAIExam: async (courseId, examDate, duration, requestData) => {
    const response = await api.post("/api/AI-Assessment/generate", {
      courseId,
      type: "Exam",
      count: requestData?.count || requestData?.numberOfQuestions || 5,
      difficulty: requestData?.difficulty,
      questionTypes: requestData?.questionTypes,
    });

    return wrapData(response.data);
  },

  // --- ExamResult Controller Endpoints ---

  submitResult: async (resultData) => {
    const response = await api.post("/api/ExamResult/Submit", resultData);
    return response.data;
  },

  getResultById: async (id) => {
    if (!id || id === "undefined" || id === "null") {
      console.warn("getResultById called with invalid ID:", id);
      return null;
    }
    const response = await api.get(`/api/ExamResult/${id}`);
    // نتحقق من وجود Wrapper أو نعيد البيانات مباشرة
    return wrapData(normalizeResult(response.data));
  },

  getResultsByExam: async (examId) => {
    if (!examId || examId === "undefined" || examId === "null") {
      console.warn("getResultsByExam called with invalid examId:", examId);
      return [];
    }
    const response = await api.get(`/api/ExamResult/ByExam/${examId}`);
    return normalizeList(response.data, normalizeResult);
  },

  getStudentResults: async (courseId, studentId = null) => {
    if (!courseId || courseId === "undefined" || courseId === "null") {
      console.warn("getStudentResults called with invalid courseId:", courseId);
      return { data: [], message: "Invalid Course ID" };
    }

    const params = {};
    if (studentId && studentId !== "null" && studentId !== "undefined") {
      params.studentId = studentId;
    }

    const response = await api.get(
      `/api/ExamResult/StudentResults/${courseId}`,
      { params },
    );
    return normalizeList(response.data, normalizeResult);
  },
};

export default examService;
