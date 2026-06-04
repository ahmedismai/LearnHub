import api from "./axios";

export const lessonProgressService = {
  completeLesson: async (lessonData) => {
    const response = await api.patch(
      `/api/Enrollment/${lessonData.enrollmentId}/complete-lesson`,
      { lessonId: lessonData.lessonId },
    );
    return response.data;
  },

  getProgress: async (enrollmentId) => {
    const response = await api.get(`/api/Enrollment/${enrollmentId}`);
    return { data: response.data };
  },
};

export default lessonProgressService;
