import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { Course } from "../models/Course.js";
import { Category } from "../models/Category.js";
import { Content, Lesson, Quiz, Assignment } from "../models/Content.js";
import { Question } from "../models/Question.js";
import { Enrollment } from "../models/Enrollment.js";
import { Submission } from "../models/Submission.js";
import { updateEnrollmentProgress } from "../utils/progress.js";
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
      .populate("categoryId", "name")
      .lean();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all courses (Admin List)
router.get("/list", async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructorId", "name email")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const validCourses = courses.filter((c) => c.instructorId !== null);
    res.json(validCourses);
  } catch (error) {
    res.status(500).json({
      error: "Server Error: Check if all categories/instructors exist.",
    });
  }
});

router.get("/ByCategory/:categoryId", async (req, res) => {
  try {
    const courses = await Course.find({
      categoryId: req.params.categoryId,
      status: "Approved",
    })
      .populate("instructorId", "name email")
      .populate("categoryId", "name")
      .lean();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/ByInstructor/:instructorId", async (req, res) => {
  try {
    const courses = await Course.find({
      instructorId: req.params.instructorId,
      status: "Approved",
    })
      .populate("instructorId", "name email")
      .populate("categoryId", "name")
      .lean();
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
      const {
        title,
        description,
        price,
        level,
        categoryId,
        thumbnail: thumbnailLink,
      } = req.body;
      const thumbnail = req.file ? req.file.path : thumbnailLink || "";
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

router.get(
  "/pending",
  protect,
  authorize(ROLES.ADMINISTRATOR, ROLES.INSTRUCTOR),
  async (req, res) => {
    try {
      const filter =
        req.user.role === ROLES.ADMINISTRATOR
          ? { status: "Pending" }
          : { status: "Pending", instructorId: req.user.id };
      const courses = await Course.find(filter)
        .populate("instructorId", "name email")
        .populate("categoryId", "name");
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get("/MyCourses", protect, async (req, res) => {
  try {
    const filter =
      req.user.role === ROLES.ADMINISTRATOR
        ? {}
        : { instructorId: req.user.id };
    const courses = await Course.find(filter)
      .populate("instructorId", "name email")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update course (Instructor/Admin)
router.put(
  "/:id",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this course" });
      }

      const {
        title,
        description,
        price,
        level,
        categoryId,
        thumbnail: thumbnailLink,
      } = req.body;

      const thumbnail = req.file
        ? req.file.path
        : thumbnailLink || course.thumbnail;

      course.title = title || course.title;
      course.description = description || course.description;
      course.price = price || course.price;
      course.level = level || course.level;
      course.categoryId = categoryId || course.categoryId;
      course.thumbnail = thumbnail;

      await course.save();

      res.json(course);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.patch(
  "/:id",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this course" });
      }

      const {
        title,
        description,
        price,
        level,
        categoryId,
        thumbnail: thumbnailLink,
      } = req.body;

      const thumbnail = req.file
        ? req.file.path
        : thumbnailLink || course.thumbnail;

      course.title = title || course.title;
      course.description = description || course.description;
      course.price = price || course.price;
      course.level = level || course.level;
      course.categoryId = categoryId || course.categoryId;
      course.thumbnail = thumbnail;

      await course.save();

      res.json(course);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Get course progress for current student
router.get("/:id/progress", protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      courseId: req.params.id,
      studentId: req.user.id,
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Recalculate to be sure it's up to date
    await updateEnrollmentProgress(enrollment);
    res.json({ percentage: enrollment.progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark video as completed
router.post("/:id/video-complete", protect, async (req, res) => {
  try {
    const { contentId } = req.body;
    const courseId = req.params.id;
    const studentId = req.user.id;

    // 1. Check if submission already exists to avoid duplicates
    const existingSubmission = await Submission.findOne({
      courseId,
      studentId,
      contentId,
      type: "video",
    });

    if (existingSubmission) {
      return res.json({ message: "Video already marked as completed" });
    }

    // 2. Create submission record
    const submission = new Submission({
      courseId,
      studentId,
      contentId,
      type: "video",
      status: "Graded", // Videos don't need manual grading
      score: 100,
    });
    await submission.save();

    // 3. Update enrollment record
    const enrollment = await Enrollment.findOne({ courseId, studentId });
    if (enrollment) {
      if (!enrollment.completedLessons.includes(contentId)) {
        enrollment.completedLessons.push(contentId);
        await updateEnrollmentProgress(enrollment);
      }
    }

    res.status(201).json({ success: true, progress: enrollment?.progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get course details
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(req.params.id)
      .populate("instructorId", "name email bio")
      .populate("categoryId", "name")
      .populate("sections")
      .populate({
        path: "contents",
        populate: { path: "sectionId", select: "title" },
      })
      .populate({
        path: "enrollments",
        populate: { path: "studentId", select: "name email" },
      })
      .populate("reviews");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Course Details Error:", error);

    try {
      const courseFallback = await Course.findById(req.params.id)
        .populate("instructorId", "name email bio")
        .populate("categoryId", "name");

      if (!courseFallback) {
        return res.status(404).json({ message: "Course not found" });
      }

      return res.json(courseFallback);
    } catch (fallbackError) {
      console.error("Course Details Fallback Error:", fallbackError);
      return res
        .status(500)
        .json({ error: "Internal Server Error while fetching course details" });
    }
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
  // upload.single("video"),
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

      const { type, title, description, ...rest } = req.body;
      
      // Clean up sectionId if it's an empty string
      const sectionId = req.body.sectionId === "" ? undefined : req.body.sectionId;

      let content;

      if (type === "Lesson") {
        const videoUrl = req.body.videoUrl || "";
        content = new Lesson({
          title,
          description,
          type,
          videoUrl,
          sectionId,
          courseId: course._id,
          ...rest
        });
      } else if (type === "Quiz") {
        const { questions, duration } = req.body;
        content = new Quiz({
          title,
          description,
          type,
          duration,
          sectionId,
          courseId: course._id,
          totalMarks: req.body.totalMarks || 100
        });
        await content.save();

        if (questions && Array.isArray(questions)) {
          const questionDocs = questions.map((q) => ({
            ...q,
            quizId: content._id,
          }));
          await Question.insertMany(questionDocs);
        }
        return res.status(201).json(content);
      } else if (type === "Assignment") {
        const { dueDate } = req.body;
        content = new Assignment({
          title,
          description,
          type,
          dueDate,
          sectionId,
          courseId: course._id,
          ...rest
        });
      } else {
        return res.status(400).json({ message: "Invalid content type" });
      }

      await content.save();
      res.status(201).json(content);
    } catch (error) {
      console.error("Content Creation Error:", error);
      // Send the specific mongoose validation error if it exists
      const errorMessage = error.errors 
        ? Object.values(error.errors).map(val => val.message).join(', ')
        : error.message;
      res.status(400).json({ message: errorMessage });
    }
  },
);

export default router;
