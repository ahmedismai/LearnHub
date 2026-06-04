import express from "express";
import { Payment, Visa, EWallet } from "../models/Payment.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post("/", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const { courseId, paymentMethod = "Visa" } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const course = await Course.findById(courseId);
    if (!course || course.status !== "Approved") {
      return res.status(404).json({ message: "Course not available" });
    }

    let order;
    const orderData = {
      studentId: req.user.id,
      courseId,
      amount: course.price,
      method: paymentMethod,
      status: "Pending",
    };

    if (paymentMethod === "Visa") {
      order = new Visa(orderData);
    } else {
      order = new EWallet(orderData);
    }

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", protect, authorize(ROLES.ADMINISTRATOR), async (_req, res) => {
  try {
    const orders = await Payment.find()
      .populate("studentId", "name email")
      .populate("courseId", "title price");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get(
  "/Pending",
  protect,
  authorize(ROLES.ADMINISTRATOR),
  async (_req, res) => {
    try {
      const pendingOrders = await Payment.find({ status: "Pending" })
        .populate("studentId", "name email")
        .populate("courseId", "title price");
      res.json(pendingOrders);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

router.get("/MyOrders", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const orders = await Payment.find({ studentId: req.user.id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/Review", protect, authorize(ROLES.ADMINISTRATOR), async (req, res) => {
  try {
    const { orderId, isApproved, rejectionReason = "" } = req.body;
    if (!orderId || typeof isApproved !== "boolean") {
      return res
        .status(400)
        .json({ message: "orderId and isApproved are required" });
    }

    const order = await Payment.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.review = rejectionReason;
    order.status = isApproved ? "Approved" : "Rejected";
    await order.save();

    if (isApproved) {
      await Enrollment.findOneAndUpdate(
        {
          studentId: order.studentId,
          courseId: order.courseId,
        },
        {
          studentId: order.studentId,
          courseId: order.courseId,
          paymentId: order._id,
          status: "Active",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
