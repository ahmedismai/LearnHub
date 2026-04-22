import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { Assignment } from "../models/Content.js";
import { Submission } from "../models/Submission.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { updateEnrollmentProgress } from "../utils/progress.js";
import { updateGrade } from "../utils/gradeUpdater.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "learnhub_assignments",
      resource_type: "auto",
      allowed_formats: ["jpg", "png", "jpeg", "pdf", "docx", "zip"],
    };
  },
});

const router = express.Router();
const upload = multer({ storage });

// Get all assignments based on role
router.get("/", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === ROLES.INSTRUCTOR) {
      const courses = await Course.find({ instructorId: req.user.id });
      const courseIds = courses.map((c) => c._id);
      query = { courseId: { $in: courseIds } };
    } else if (req.user.role === ROLES.STUDENT) {
      const enrollments = await Enrollment.find({ studentId: req.user.id });
      const courseIds = enrollments.map((e) => e.courseId);
      query = { courseId: { $in: courseIds } };
    } else if (req.user.role === ROLES.ADMINISTRATOR) {
      query = {};
    }

    const assignments = await Assignment.find({
      ...query,
      contentType: "Assignment",
    }).populate("courseId", "title");
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all assignments for an instructor or admin
router.get("/Instructor/AllAssignments", protect, authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR), async (req, res) => {
  try {
    let query = {};
    if (req.user.role === ROLES.INSTRUCTOR) {
      const courses = await Course.find({ instructorId: req.user.id });
      const courseIds = courses.map(c => c._id);
      query = { courseId: { $in: courseIds } };
    }
    
    const assignments = await Assignment.find({
      ...query,
      contentType: "Assignment",
    }).populate("courseId", "title");
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get assignments for a course
router.get("/course/:courseId", protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({
      courseId: req.params.courseId,
      contentType: "Assignment",
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit an assignment (Student)
router.post(
  "/:assignmentId/submit",
  protect,
  authorize(ROLES.STUDENT),
  upload.single("file"),
  async (req, res) => {
    try {
      const fileUrl = req.file ? req.file.path : req.body.fileUrl;
      if (!fileUrl) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const assignment = await Assignment.findById(req.params.assignmentId);
      if (!assignment || assignment.contentType !== "Assignment") {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const submission = await Submission.findOneAndUpdate(
        { studentId: req.user.id, assignmentId: assignment._id },
        { submittedFile: fileUrl, status: "Submitted", date: Date.now() },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: assignment.courseId,
      });

      if (enrollment) {
        const completedAssignments = new Set(
          (enrollment.completedAssignments || []).map((id) => String(id)),
        );
        completedAssignments.add(String(assignment._id));
        enrollment.completedAssignments = Array.from(completedAssignments);
        await updateEnrollmentProgress(enrollment);
      }

      res
        .status(201)
        .json({ message: "Assignment submitted successfully", submission });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
);

// Get all submissions for an assignment (Instructor/Admin)
router.get(
  "/submissions/:assignmentId",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.assignmentId);
      if (!assignment || assignment.contentType !== "Assignment") {
        return res.status(404).json({ message: "Assignment not found" });
      }

      if (req.user.role === ROLES.INSTRUCTOR) {
        const course = await Course.findById(assignment.courseId);
        if (!course || String(course.instructorId) !== String(req.user.id)) {
          return res
            .status(403)
            .json({ message: "Not authorized to view these submissions" });
        }
      }

      const submissions = await Submission.find({
        assignmentId: assignment._id,
      })
        .populate("studentId", "name email")
        .sort({ date: -1 });
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// Grade or review a submission
router.patch(
  "/submissions/:submissionId/grade",
  protect,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const { score, feedback } = req.body;
      const submission = await Submission.findById(req.params.submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      const assignment = await Assignment.findById(submission.assignmentId);
      if (!assignment || assignment.contentType !== "Assignment") {
        return res.status(404).json({ message: "Assignment not found" });
      }

      if (req.user.role === ROLES.INSTRUCTOR) {
        const course = await Course.findById(assignment.courseId);
        if (!course || String(course.instructorId) !== String(req.user.id)) {
          return res
            .status(403)
            .json({ message: "Not authorized to grade this submission" });
        }
      }

      submission.score = score;
      submission.feedback = feedback;
      submission.status = "Graded";
      await submission.save();

      // Update Grade record
      await updateGrade({
        studentId: submission.studentId,
        courseId: assignment.courseId,
        assignmentId: assignment._id,
        type: "Assignment",
        score,
        maxScore: 100, // Assuming assignments are out of 100
      });

      res.json({ message: "Submission graded successfully", submission });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

export default router;
