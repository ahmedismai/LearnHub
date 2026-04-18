import express from "express";
import { Lesson, Content } from "../models/Content.js";
import { Section } from "../models/Section.js";
import { Course } from "../models/Course.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post(
  "/course/:courseId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const { sectionId, title, description, duration, videoUrl } = req.body;
      const courseId = req.params.courseId;
      if (!title || !description || !videoUrl) {
        return res.status(400).json({
          message: "title, description and videoUrl are required",
        });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to create lesson for this course" });
      }

      let finalSectionId = sectionId;
      if (!sectionId) {
        // Create a default section if not provided
        const defaultSection = new Section({
          courseId,
          title: "Default Section",
          description: "Default section for lessons",
          order: 1,
        });
        await defaultSection.save();
        finalSectionId = defaultSection._id;
      } else {
        const section = await Section.findById(sectionId);
        if (!section || String(section.courseId) !== String(courseId)) {
          return res
            .status(404)
            .json({ message: "Section not found for the provided course" });
        }
      }

      const lesson = new Lesson({
        courseId,
        sectionId: finalSectionId,
        title,
        description,
        duration,
        videoUrl,
        type: "Lesson",
      });

      await lesson.save();
      res.status(201).json(lesson);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get("/Details/:lessonId", async (req, res) => {
  try {
    const lesson = await Lesson.findOne({
      _id: req.params.lessonId,
      contentType: "Lesson",
    });
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:sectionId", async (req, res) => {
  try {
    const lessons = await Lesson.find({
      sectionId: req.params.sectionId,
      contentType: "Lesson",
    });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch(
  "/:lessonId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const lesson = await Lesson.findOne({
        _id: req.params.lessonId,
        contentType: "Lesson",
      });
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.patch(
  "/:lessonId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const lesson = await Lesson.findOne({
        _id: req.params.lessonId,
        contentType: "Lesson",
      });
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      const course = await Course.findById(lesson.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this lesson" });
      }

      lesson.title = req.body.title || lesson.title;
      lesson.description = req.body.description || lesson.description;
      lesson.duration = req.body.duration || lesson.duration;
      lesson.videoUrl = req.body.videoUrl || lesson.videoUrl;
      await lesson.save();

      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.delete(
  "/:lessonId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const lesson = await Lesson.findOne({
        _id: req.params.lessonId,
        contentType: "Lesson",
      });
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      const course = await Course.findById(lesson.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this lesson" });
      }

      await lesson.deleteOne();
      res.json({ message: "Lesson deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
