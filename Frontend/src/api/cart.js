import api from "./axios";
import { normalizeCourse } from "./adapters";

const normalizeCartItem = (item = {}) => {
  const course = normalizeCourse(item.courseId || item.course || {});
  return {
    ...item,
    id: item.id || item._id || item.cartItemId,
    cartItemId: item.cartItemId || item.id || item._id,
    courseId: course.courseId,
    course,
  };
};

const normalizeCart = (payload) => {
  const data = payload?.data || payload;
  return {
    data: Array.isArray(data) ? data.map(normalizeCartItem) : [],
  };
};

export const cartService = {
  getAll: async () => {
    try {
      const response = await api.get("/api/Cart");
      return normalizeCart(response.data);
    } catch (error) {
      if (error.response?.status === 404) return { data: [] };
      throw error;
    }
  },

  add: async (courseId) => {
    const response = await api.post("/api/Cart", { courseId });
    return { data: normalizeCartItem(response.data) };
  },

  remove: async (courseId) => {
    const response = await api.delete(`/api/Cart/${courseId}`);
    return response.data;
  },

  clear: async () => {
    const response = await api.delete("/api/Cart");
    return response.data;
  },

  checkout: async (paymentMethod = "Visa") => {
    const response = await api.post("/api/Cart/Checkout", { paymentMethod });
    return response.data;
  },
};

export default cartService;
