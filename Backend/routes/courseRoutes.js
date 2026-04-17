import express from "express";
import multer from "multer";
import { Course } from "../models/Course.js";
import { Category } from "../models/Category.js";
import { Content, Lesson, Quiz, Assignment } from "../models/Content.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video");
    return {
      folder: "learnhub_courses",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov", "avi"],
    };
  },
});

const router = express.Router();
const upload = multer({ storage });

// Get all approved courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find({ status: "Approved" })
      .populate("instructorId", "name")
      .populate("categoryId", "name");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new course (Instructor/Admin)
router.post(
  "/",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const { title, description, price, level, categoryId } = req.body;
      const thumbnail = req.file ? req.file.path : "";

      const course = new Course({
        title,
        description,
        price,
        level,
        categoryId,
        instructorId: req.user.id,
        status: "Pending",
        thumbnail,
      });
      await course.save();
      res.status(201).json(course);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

// Get my courses or all (Admin)
router.get(
  "/mine",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    const filter =
      req.user.role === ROLES.ADMINISTRATOR
        ? {}
        : { instructorId: req.user.id };
    const courses = await Course.find(filter)
      .populate("instructorId", "name email")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });
    res.json(courses);
  },
);

// Get course details
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructorId", "name email bio")
      .populate("categoryId", "name")
      .populate("contents")
      .populate("reviews");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update course status (Admin)
router.patch(
  "/:id/status",
  protect,
  authorize(ROLES.ADMINISTRATOR),
  async (req, res) => {
    const { status } = req.body;
    const allowed = ["Pending", "Approved", "Rejected"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  },
);

// Add Content to Course (Lesson, Quiz, Assignment)
router.post(
  "/:id/contents",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  upload.single("video"),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });

      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to add content to this course" });
      }

      const { type, ...rest } = req.body;
      let content;

      if (type === "Lesson") {
        // إذا كان هناك ملف مرفوع نأخذ مساره، وإلا نستخدم الرابط النصي لو موجود
        const videoUrl = req.file ? req.file.path : rest.videoUrl || "";
        content = new Lesson({
          ...rest,
          videoUrl,
          type,
          courseId: course._id,
        });
      } else if (type === "Quiz") {
        content = new Quiz({ ...rest, type, courseId: course._id });
      } else if (type === "Assignment") {
        content = new Assignment({ ...rest, type, courseId: course._id });
      } else {
        return res.status(400).json({ message: "Invalid content type" });
      }

      await content.save();
      res.status(201).json(content);
    } catch (error) {
      console.error("Content Creation Error:", error);
      res.status(400).json({ error: error.message });
    }
  },
);

export default router;
