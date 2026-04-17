import express from "express";
import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";
import { Content } from "../models/Content.js";
import { Payment, Visa, EWallet } from "../models/Payment.js";
import { updateEnrollmentProgress } from "../utils/progress.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post("/", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const { courseId, paymentMethod = "Visa" } = req.body;

    const course = await Course.findById(courseId);
    if (!course || course.status !== "Approved") {
      return res.status(404).json({ message: "Course not available" });
    }

    const exists = await Enrollment.findOne({
      studentId: req.user.id,
      courseId,
    });

    if (exists) {
      return res.status(409).json({ message: "Already enrolled" });
    }

    // Create Payment record based on method
    let payment;
    const paymentData = {
      studentId: req.user.id,
      courseId,
      amount: course.price,
      method: paymentMethod,
    };

    if (paymentMethod === "Visa") {
      payment = new Visa(paymentData);
    } else {
      payment = new EWallet(paymentData);
    }
    await payment.save();

    const enrollment = await Enrollment.create({
      studentId: req.user.id,
      courseId,
      paymentId: payment._id,
      status: "Active",
    });

    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/me", protect, authorize(ROLES.STUDENT), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user.id }).populate({
      path: "courseId",
      populate: { path: "instructorId", select: "name email" },
    });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch(
  "/:id/complete-lesson",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const { lessonId } = req.body;
      const enrollment = await Enrollment.findOne({
        _id: req.params.id,
        studentId: req.user.id,
      });

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      const lesson = await Content.findOne({ _id: lessonId, courseId: enrollment.courseId, contentType: 'Lesson' });
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      const completedLessons = new Set((enrollment.completedLessons || []).map(String));
      completedLessons.add(String(lessonId));
      enrollment.completedLessons = Array.from(completedLessons);

      await updateEnrollmentProgress(enrollment);

      res.json(enrollment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;