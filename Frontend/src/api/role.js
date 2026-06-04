import api from "./axios";

const roleService = {
  getAll: async () => {
    const response = await api.get("/api/Role");
    return { data: response.data?.roles || response.data };
  },

  create: async (roleName) => {
    const response = await api.post(`/api/Role/${roleName}`);
    return response.data;
  },

  delete: async (roleName) => {
    const response = await api.delete(`/api/Role/${roleName}`);
    return response.data;
  },

  assignRole: async (userId, roleName) => {
    const response = await api.post(`/api/Role/AssignRole/${userId}/${roleName}`);
    return response.data;
  },

  unassignRole: async (userId, roleName) => {
    const response = await api.delete(`/api/Role/UnAssignRole/${userId}/${roleName}`);
    return response.data;
  },
};

export default roleService;
