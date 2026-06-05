import api from "./axios";
import { normalizeCourse } from "./adapters";

const normalizeWishlistItem = (item = {}) => {
  const course = normalizeCourse(item.courseId || item.course || {});
  return {
    ...item,
    id: item.id || item._id || item.wishlistItemId,
    wishlistItemId: item.wishlistItemId || item.id || item._id,
    courseId: course.courseId,
    course,
  };
};

const normalizeWishlist = (payload) => {
  const data = payload?.data || payload;
  return {
    data: Array.isArray(data) ? data.map(normalizeWishlistItem) : [],
  };
};

export const wishlistService = {
  getAll: async () => {
    try {
      const response = await api.get("/api/Wishlist");
      return normalizeWishlist(response.data);
    } catch (error) {
      if (error.response?.status === 404) return { data: [] };
      throw error;
    }
  },

  add: async (courseId) => {
    const response = await api.post("/api/Wishlist", { courseId });
    return { data: normalizeWishlistItem(response.data) };
  },

  remove: async (courseId) => {
    const response = await api.delete(`/api/Wishlist/${courseId}`);
    return response.data;
  },
};

export default wishlistService;
