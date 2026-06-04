import api from "./axios";

const sectionService = {
  // GET /api/Section/{courseId}
  getByCourse: async (courseId) => {
    const response = await api.get(`/api/Section/${courseId}`);
    return response.data;
  },

  // GET /api/Section/Details/{sectionId}
  getDetails: async (sectionId) => {
    const response = await api.get(`/api/Section/Details/${sectionId}`);
    return response.data;
  },

  // POST /api/Section
  create: async (sectionData) => {
    const response = await api.post("/api/Section", sectionData);
    return response.data;
  },

  // PATCH /api/Section/{sectionId}
  update: async (sectionId, sectionData) => {
    const response = await api.patch(`/api/Section/${sectionId}`, sectionData);
    return response.data;
  },

  // DELETE /api/Section/{sectionId}
  delete: async (sectionId) => {
    const response = await api.delete(`/api/Section/${sectionId}`);
    return response.data;
  },
};

export default sectionService;
