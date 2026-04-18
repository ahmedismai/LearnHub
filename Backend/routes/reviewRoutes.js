import express from "express";
import { Review } from "../models/Review.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get("/course/:courseId", async (req, res) => {
  try {
    const reviews = await Review.find({
      courseId: req.params.courseId,
    }).populate("studentId", "name profileImage");
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    const review = new Review({
      courseId,
      studentId: req.user.id,
      rating,
      comment,
    });
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete(
  "/:courseId/:studentId",
  protect,
  authorize(ROLES.ADMINISTRATOR, ROLES.INSTRUCTOR, ROLES.STUDENT),
  async (req, res) => {
    try {
      const { courseId, studentId } = req.params;
      const review = await Review.findOne({ courseId, studentId });
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      if (
        req.user.role === ROLES.STUDENT &&
        String(review.studentId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this review" });
      }

      await review.deleteOne();
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
