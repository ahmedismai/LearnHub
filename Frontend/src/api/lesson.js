import api from "./axios";

const formDataToObject = (data) => {
  if (!(data instanceof FormData)) return data;
  return Object.fromEntries(data.entries());
};

export const lessonService = {
  // GET /api/Lesson/{SectionId}
  getBySection: async (sectionId) => {
    const response = await api.get(`/api/Lesson/${sectionId}`);
    return response.data;
  },

  // DELETE /api/Lesson/{lessonId}
  delete: async (lessonId) => {
    const response = await api.delete(`/api/Lesson/${lessonId}`);
    return response.data;
  },

  // PATCH /api/Lesson/{lessonId}
  update: async (lessonId, lessonData) => {
    const payload = formDataToObject(lessonData);
    const response = await api.patch(`/api/Lesson/${lessonId}`, {
      title: payload.title,
      description: payload.description || "Course lesson",
      duration: payload.duration || payload.durationInMinutes,
      videoUrl: payload.videoUrl || payload.mediaUrl || "",
    });
    return response.data;
  },

  // GET /api/Lesson/Details/{lessonId}
  getDetails: async (lessonId) => {
    const response = await api.get(`/api/Lesson/Details/${lessonId}`);
    return response.data;
  },

  // POST /api/Lesson
  create: async (lessonData) => {
    const payload = formDataToObject(lessonData);
    const response = await api.post(`/api/Lesson/course/${payload.courseId}`, {
      sectionId: payload.sectionId,
      title: payload.title,
      description: payload.description || "Course lesson",
      duration: payload.duration || payload.durationInMinutes,
      videoUrl: payload.videoUrl || payload.mediaUrl || "",
    });
    return response.data;
  },
};

export default lessonService;
