import api from "./axios";
import { normalizeCategory, normalizeList, wrapData } from "./adapters";

const categoryService = {
  // GET /api/Category
  getAll: async (name = null) => {
    const response = await api.get("/api/Category", { params: { name } });
    return normalizeList(response.data, normalizeCategory);
  },

  // GET /api/Category/List
  getList: async () => {
    const response = await api.get("/api/Category/list");
    return normalizeList(response.data, normalizeCategory);
  },

  // GET /api/Category/{categoryId}
  getById: async (categoryId) => {
    const response = await api.get(`/api/Category/${categoryId}`);
    return wrapData(normalizeCategory(response.data));
  },

  // POST /api/Category
  create: async (formData) => {
    const response = await api.post("/api/Category", formData);
    return wrapData(normalizeCategory(response.data));
  },

  // PATCH /api/Category/{categoryId}
  update: async (categoryId, formData) => {
    const response = await api.patch(`/api/Category/${categoryId}`, formData);
    return wrapData(normalizeCategory(response.data));
  },

  // DELETE /api/Category/{categoryId}
  delete: async (categoryId) => {
    const response = await api.delete(`/api/Category/${categoryId}`);
    return response.data;
  },
};

export default categoryService;
