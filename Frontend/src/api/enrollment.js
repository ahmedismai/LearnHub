import api from "./axios";
import { normalizeEnrollment, normalizeList, wrapData } from "./adapters";

const shouldUseCurrentStudentEnrollments = (studentId) => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return (
      user?.role === "Student" &&
      studentId &&
      String(user.id || user.userId || user.studentId) === String(studentId)
    );
  } catch {
    return false;
  }
};

export const enrollmentService = {
  // GET /api/Enrollment (Admin only)
  getAll: async (params) => {
    const response = await api.get("/api/Enrollment", { params });
    return normalizeList(response.data, normalizeEnrollment);
  },

  // POST /api/Enrollment
  create: async (enrollmentData) => {
    const response = await api.post("/api/Enrollment", enrollmentData);
    return wrapData(normalizeEnrollment(response.data));
  },

  // GET /api/Enrollment/ByCourse/{courseId}
  getByCourse: async (courseId) => {
    const response = await api.get(`/api/Enrollment/ByCourse/${courseId}`);
    return normalizeList(response.data, normalizeEnrollment);
  },

  // GET /api/Enrollment/ByStudent/{studentId}
  getByStudent: async (studentId) => {
    const endpoint = shouldUseCurrentStudentEnrollments(studentId)
      ? "/api/Enrollment/me"
      : `/api/Enrollment/ByStudent/${studentId}`;
    const response = await api.get(endpoint);
    return normalizeList(response.data, normalizeEnrollment);
  },

  // DELETE /api/Enrollment/{enrollmentId}
  delete: async (enrollmentId) => {
    const response = await api.delete(`/api/Enrollment/${enrollmentId}`);
    return response.data;
  },

  // GET /api/Enrollment/{enrollmentId}
  getById: async (enrollmentId) => {
    const response = await api.get(`/api/Enrollment/${enrollmentId}`);
    return wrapData(normalizeEnrollment(response.data));
  },

  // PUT /api/Enrollment/{enrollmentId} (Admin only)
  update: async (enrollmentId, enrollmentData) => {
    const response = await api.put(`/api/Enrollment/${enrollmentId}`, enrollmentData);
    return wrapData(normalizeEnrollment(response.data));
  },
};

export default enrollmentService;
