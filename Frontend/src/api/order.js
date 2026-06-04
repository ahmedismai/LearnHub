import api from "./axios";
import { wrapData } from "./adapters";

const normalizeOrder = (order = {}) => ({
  ...order,
  id: order.id || order._id || order.orderId || order.paymentId,
  orderId: order.orderId || order.paymentId || order.id || order._id,
  studentId: order.studentId?._id || order.studentId?.id || order.studentId,
  studentName: order.studentName || order.studentId?.name || "Student",
  courseId: order.courseId?._id || order.courseId?.id || order.courseId,
  courseTitle: order.courseTitle || order.courseId?.title || "Course",
  price: order.price ?? order.amount ?? order.courseId?.price ?? 0,
});

const normalizeOrders = (payload) => {
  const data = payload?.data || payload;
  return { data: Array.isArray(data) ? data.map(normalizeOrder) : [] };
};

export const orderService = {
  // POST /api/Order
  create: async (orderData) => {
    const response = await api.post("/api/Order", orderData);
    return wrapData(normalizeOrder(response.data));
  },

  // GET /api/Order (Admin only)
  getAll: async () => {
    const response = await api.get("/api/Order");
    return normalizeOrders(response.data);
  },

  // GET /api/Order/Pending (Admin only)
  getPending: async () => {
    const response = await api.get("/api/Order/Pending");
    return normalizeOrders(response.data);
  },

  // GET /api/Order/MyOrders
  getMyOrders: async () => {
    const response = await api.get("/api/Order/MyOrders");
    return normalizeOrders(response.data);
  },

  // PUT /api/Order/Review (Admin only)
  review: async (reviewData) => {
    const response = await api.put("/api/Order/Review", reviewData);
    return wrapData(normalizeOrder(response.data));
  },
};

export default orderService;
