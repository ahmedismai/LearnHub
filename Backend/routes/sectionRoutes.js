import express from "express";
import { Section } from "../models/Section.js";
import { Course } from "../models/Course.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const { courseId, title, description, order } = req.body;
      if (!courseId || !title || !description) {
        return res
          .status(400)
          .json({ message: "courseId, title and description are required" });
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
          .json({ message: "Not authorized to add sections to this course" });
      }

      const section = new Section({ courseId, title, description, order });
      await section.save();
      res.status(201).json(section);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.get("/Details/:sectionId", async (req, res) => {
  try {
    const section = await Section.findById(req.params.sectionId);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:courseId", async (req, res) => {
  try {
    const sections = await Section.find({ courseId: req.params.courseId }).sort(
      { order: 1, createdAt: 1 },
    );
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch(
  "/:sectionId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const section = await Section.findById(req.params.sectionId);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      res.json(section);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.patch(
  "/:sectionId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const section = await Section.findById(req.params.sectionId);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }

      const course = await Course.findById(section.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this section" });
      }

      section.title = req.body.title || section.title;
      section.description = req.body.description || section.description;
      if (req.body.order !== undefined) {
        section.order = req.body.order;
      }
      await section.save();
      res.json(section);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.delete(
  "/:sectionId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const section = await Section.findById(req.params.sectionId);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }

      const course = await Course.findById(section.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (
        req.user.role === ROLES.INSTRUCTOR &&
        String(course.instructorId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this section" });
      }

      await section.deleteOne();
      res.json({ message: "Section deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
