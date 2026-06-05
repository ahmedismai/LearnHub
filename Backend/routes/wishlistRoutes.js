import express from "express";
import { Course } from "../models/Course.js";
import { WishlistItem } from "../models/Wishlist.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get("/", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const items = await WishlistItem.find({ studentId: req.user.id })
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

    const item = await WishlistItem.findOneAndUpdate(
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
    await WishlistItem.findOneAndDelete({
      studentId: req.user.id,
      courseId: req.params.courseId,
    });

    res.json({ message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
