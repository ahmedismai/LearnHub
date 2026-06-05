import express from "express";
import { CartItem } from "../models/Cart.js";
import { Course } from "../models/Course.js";
import { Payment, Visa, EWallet } from "../models/Payment.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

const getCartItems = (studentId) =>
  CartItem.find({ studentId })
    .populate({
      path: "courseId",
      select: "title description price thumbnail categoryId instructorId status",
      populate: [
        { path: "categoryId", select: "name" },
        { path: "instructorId", select: "name" },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

router.get("/", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const items = await getCartItems(req.user.id);
    res.json(items.filter((item) => item.courseId));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const course = await Course.findById(courseId).select("_id status");
    if (!course || course.status !== "Approved") {
      return res.status(404).json({ message: "Course not available" });
    }

    const item = await CartItem.findOneAndUpdate(
      { studentId: req.user.id, courseId },
      { studentId: req.user.id, courseId },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).populate("courseId", "title price thumbnail");

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:courseId", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    await CartItem.findOneAndDelete({
      studentId: req.user.id,
      courseId: req.params.courseId,
    });

    res.json({ message: "Removed from cart" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    await CartItem.deleteMany({ studentId: req.user.id });
    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/Checkout", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const { paymentMethod = "Visa" } = req.body;
    const items = await getCartItems(req.user.id);
    const availableItems = items.filter(
      (item) => item.courseId && item.courseId.status === "Approved",
    );

    if (availableItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const courseIds = availableItems.map((item) => item.courseId._id);
    const existingOrders = await Payment.find({
      studentId: req.user.id,
      courseId: { $in: courseIds },
      status: { $in: ["Pending", "Approved"] },
    }).select("courseId");
    const orderedCourseIds = new Set(
      existingOrders.map((order) => String(order.courseId)),
    );

    const orders = [];
    for (const item of availableItems) {
      if (orderedCourseIds.has(String(item.courseId._id))) continue;

      const orderData = {
        studentId: req.user.id,
        courseId: item.courseId._id,
        amount: Number(item.courseId.price || 0),
        method: paymentMethod === "E-Wallet" ? "E-Wallet" : "Visa",
        status: "Pending",
      };
      const order =
        orderData.method === "E-Wallet"
          ? new EWallet(orderData)
          : new Visa(orderData);
      await order.save();
      orders.push(order);
    }

    await CartItem.deleteMany({ studentId: req.user.id });

    res.status(201).json({
      message: "Checkout submitted for admin approval",
      orders,
      skippedExistingOrders: existingOrders.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
