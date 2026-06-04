import api from "./axios";
import { normalizeList, normalizeUser, wrapData } from "./adapters";

const accountService = {

  // POST /api/Account/Register
  register: async (registerData) => {
    const response = await api.post("/api/Account/Register", registerData);
    return response.data;
  },

  // POST /api/Account/Login
  login: async (loginData) => {
    const response = await api.post("/api/Account/Login", loginData);
    return response.data;
  },

  // POST /api/Account/Logout
  logout: async (refreshToken) => {
    const response = await api.post("/api/Account/Logout", { refreshToken });
    return response.data;
  },

  // GET /api/Account/Account/GetProfile
  getProfile: async () => {
    const response = await api.get("/api/Account/Account/GetProfile");
    return wrapData(normalizeUser(response.data));
  },

  // PUT /api/Account/Account/UpdateProfile
  updateProfile: async (profileData) => {
    const response = await api.put("/api/Account/Account/UpdateProfile", profileData);
    return wrapData(normalizeUser(response.data));
  },

  // GET /api/Account/Users (Admin)
  getAllUsers: async () => {
    const response = await api.get("/api/Account/Users");
    return normalizeList(response.data, normalizeUser);
  },

  // DELETE /api/Account/DeleteUser/{userId} (Admin)
  deleteUser: async (userId) => {
    const response = await api.delete(`/api/Account/DeleteUser/${userId}`);
    return response.data;
  },

  // POST /api/Account/ResetPassword
  resetPassword: async (email) => {
    const response = await api.post("/api/Account/ResetPassword", { email });
    return response.data;
  },

  // POST /api/Account/NewPassword
  newPassword: async (resetData) => {
    const response = await api.post("/api/Account/NewPassword", resetData);
    return response.data;
  },

  // GET /api/Account/ConfirmEmail
  confirmEmail: async (userId, token) => {
    const response = await api.get("/api/Account/ConfirmEmail", {
      params: { userId, token },
    });
    return response.data;
  },

  // POST /api/Account/ResendConfirmEmail
  resendConfirmEmail: async (email) => {
    const response = await api.post("/api/Account/ResendConfirmEmail", { email });
    return response.data;
  },

  // GET /api/Account/ConfirmResetPassword
  confirmResetPassword: async (userId, token) => {
    const response = await api.get("/api/Account/ConfirmResetPassword", {
      params: { userId, token },
    });
    return response.data;
  },
};

export default accountService;
