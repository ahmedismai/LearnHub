import api from "./axios";
import { normalizeList, wrapData } from "./adapters";

export const normalizeAssignment = (assignment = {}) => {
  const course = assignment.courseId || assignment.course || {};
  const assignmentId =
    assignment.assignmentId || assignment.contentId || assignment.id || assignment._id;

  return {
    ...assignment,
    id: assignment.id || assignment._id || assignmentId,
    _id: assignment._id || assignmentId,
    assignmentId,
    contentId: assignment.contentId || assignment._id || assignmentId,
    courseId: course?._id || course?.id || assignment.courseId,
    courseTitle: assignment.courseTitle || course?.title || "Course",
    dueDate: assignment.dueDate || assignment.deadline,
    isCompleted: Boolean(assignment.isCompleted || assignment.completed),
  };
};

const assignmentService = {
  getAll: async () => {
    const response = await api.get("/api/Assignment");
    return normalizeList(response.data, normalizeAssignment);
  },

  getInstructorAssignments: async () => {
    const response = await api.get("/api/Assignment/Instructor/AllAssignments");
    return normalizeList(response.data, normalizeAssignment);
  },

  getByCourse: async (courseId) => {
    const response = await api.get(`/api/Assignment/course/${courseId}`);
    return normalizeList(response.data, normalizeAssignment);
  },

  getById: async (assignmentId) => {
    const response = await api.get(`/api/Assignment/${assignmentId}`);
    return wrapData(normalizeAssignment(response.data));
  },

  submit: async (assignmentId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/api/Assignment/${assignmentId}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getSubmissions: async (assignmentId) => {
    const response = await api.get(`/api/Assignment/submissions/${assignmentId}`);
    return response.data;
  },

  gradeSubmission: async (submissionId, data) => {
    const response = await api.patch(
      `/api/Assignment/submissions/${submissionId}/grade`,
      data,
    );
    return response.data;
  },
};

export default assignmentService;
