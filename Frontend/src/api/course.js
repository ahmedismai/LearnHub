import api from "./axios";
import { normalizeCourse, normalizeList, wrapData } from "./adapters";

const courseService = {
  // GET /api/Course
  // Filters: name, pageNumber, pageSize, isFree
  // SortBy: price, price_desc, title, newest
  getAll: async (params) => {
    const response = await api.get("/api/Course", { params });
    return normalizeList(response.data, normalizeCourse);
  },

  // POST /api/Course
  create: async (formData) => {
    const response = await api.post("/api/Course", formData);
    return wrapData(normalizeCourse(response.data));
  },

  // GET /api/Course/List
  getList: async () => {
    const response = await api.get("/api/Course/list");
    return normalizeList(response.data, normalizeCourse);
  },

  // GET /api/Course/ByCategory/{categoryId}
  getByCategory: async (categoryId) => {
    const response = await api.get(`/api/Course/ByCategory/${categoryId}`);
    return normalizeList(response.data, normalizeCourse);
  },

  // GET /api/Course/ByInstructor/{instructorId}
  getByInstructor: async (instructorId) => {
    const response = await api.get(`/api/Course/ByInstructor/${instructorId}`);
    return normalizeList(response.data, normalizeCourse);
  },

  // DELETE /api/Course/{courseId}
  delete: async (courseId) => {
    const response = await api.delete(`/api/Course/${courseId}`);
    return response.data;
  },

  // GET /api/Course/{courseId}
  getById: async (courseId) => {
    const response = await api.get(`/api/Course/${courseId}`);
    return wrapData(normalizeCourse(response.data));
  },

  // PATCH /api/Course/{courseId}
  update: async (courseId, formData) => {
    const response = await api.patch(`/api/Course/${courseId}`, formData);
    return wrapData(normalizeCourse(response.data));
  },

  // GET /api/Course/pending
  getPending: async () => {
    const response = await api.get("/api/Course/pending", {
      params: { pageNumber: 1, pageSize: 10 },
    });
    return normalizeList(response.data, normalizeCourse);
  },

  // PATCH /api/Course/{courseId}/status
  approve: async (courseId, data) => {
    const status = data?.status || (data?.isApproved ? "Approved" : "Rejected");
    const response = await api.patch(`/api/Course/${courseId}/status`, {
      status,
    });
    return wrapData(normalizeCourse(response.data));
  },

  // GET /api/Course/MyCourses
  getMyCourses: async () => {
    const response = await api.get("/api/Course/MyCourses");
    return normalizeList(response.data, normalizeCourse);
  },
};

export default courseService;
