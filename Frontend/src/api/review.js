import api from "./axios";

const isValidId = (id) =>
  id !== undefined && id !== null && id !== "" && id !== "undefined" && id !== "null";

const reviewService = {
  getAllByCourse: async (courseId) => {
    if (!isValidId(courseId)) return { data: [] };
    const response = await api.get(`/api/Review/course/${courseId}`);
    return { data: response.data };
  },

  create: async (reviewData) => {
    const response = await api.post("/api/Review", reviewData);
    return response.data;
  },

  delete: async (courseId, studentId) => {
    const response = await api.delete(`/api/Review/${courseId}/${studentId}`);
    return response.data;
  },
};

export default reviewService;
