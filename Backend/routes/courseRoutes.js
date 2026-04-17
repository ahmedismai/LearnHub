import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { Course } from "../models/Course.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "learnhub_courses",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage });

// الحصول على كل الكورسات المقبولة (للكل)
router.get("/", async (req, res) => {
  const courses = await Course.find({ status: "Approved" }).populate(
    "instructorId",
    "username",
  );
  res.json(courses);
});

// إنشاء كورس جديد (Instructor فقط)
router.post(
  "/",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const { title, description, price, level, category } = req.body;
      const thumbnail = req.file ? req.file.path : "";
      const course = new Course({
        title,
        description,
        price,
        level,
        category,
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

// كورساتي (Instructor) أو كل الكورسات (Administrator)
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
      .populate("instructorId", "username email")
      .sort({ createdAt: -1 });
    res.json(courses);
  },
);

router.get("/:id", async (req, res) => {
  const course = await Course.findById(req.params.id).populate(
    "instructorId",
    "username email",
  );
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }
  res.json(course);
});

// تحديث حالة الكورس (Administrator فقط)
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

export default router;
