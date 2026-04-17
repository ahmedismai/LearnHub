import express from "express";
import { Assignment } from "../models/Content.js";
import { Submission } from "../models/Submission.js";
import { Enrollment } from "../models/Enrollment.js";
import { updateEnrollmentProgress } from "../utils/progress.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// Get assignments for a course
router.get("/course/:courseId", protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({ courseId: req.params.courseId, contentType: 'Assignment' });
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
  async (req, res) => {
    try {
      const { fileUrl } = req.body;
      const assignment = await Assignment.findById(req.params.assignmentId);
      if (!assignment || assignment.contentType !== 'Assignment') {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const submission = await Submission.findOneAndUpdate(
        { studentId: req.user.id, assignmentId: assignment._id },
        { submittedFile: fileUrl, status: "Submitted", date: Date.now() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: assignment.courseId,
      });

      if (enrollment) {
        const completedAssignments = new Set((enrollment.completedAssignments || []).map(id => String(id)));
        completedAssignments.add(String(assignment._id));
        enrollment.completedAssignments = Array.from(completedAssignments);
        await updateEnrollmentProgress(enrollment);
      }

      res.status(201).json({ message: "Assignment submitted successfully", submission });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

export default router;