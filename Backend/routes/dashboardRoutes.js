import express from "express";
import mongoose from "mongoose";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Certificate } from "../models/Certificate.js";
import { Exam } from "../models/Exam.js";
import { ExamResult } from "../models/ExamResult.js";
import { User } from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get(
  "/AdminDashboard",
  protect,
  authorize(ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalCourses,
        totalEnrollments,
        pendingCourses,
        totalStudents,
        totalInstructors
      ] = await Promise.all([
        User.countDocuments(),
        Course.countDocuments(),
        Enrollment.countDocuments(),
        Course.countDocuments({ status: "Pending" }),
        User.countDocuments({ role: ROLES.STUDENT }),
        User.countDocuments({ role: ROLES.INSTRUCTOR }),
      ]);

      res.json({
        totalUsers,
        totalCourses,
        totalEnrollments,
        pendingCourses,
        totalStudents,
        totalInstructors,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.get(
  "/InstructorDashboard",
  protect,
  authorize(ROLES.INSTRUCTOR),
  async (req, res) => {
    try {
      const instructorId = req.user.id;
      
      const [courses, stats] = await Promise.all([
        Course.find({ instructorId }).select("_id status").lean(),
        Course.aggregate([
          { $match: { instructorId: new mongoose.Types.ObjectId(instructorId) } },
          { $group: {
            _id: "$status",
            count: { $sum: 1 }
          }}
        ])
      ]);

      const courseIds = courses.map(c => c._id);
      const totalEnrollments = await Enrollment.countDocuments({ courseId: { $in: courseIds } });

      const statsMap = stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      res.json({
        totalCourses: courses.length,
        pendingCourses: statsMap["Pending"] || 0,
        approvedCourses: statsMap["Approved"] || 0,
        totalEnrollments,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.get(
  "/StudentDashboard",
  protect,
  authorize(ROLES.STUDENT),
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const enrollments = await Enrollment.find({ studentId })
        .populate({
          path: "courseId",
          select: "title thumbnail categoryId instructorId",
          populate: [
            { path: "categoryId", select: "name" },
            { path: "instructorId", select: "name" },
          ],
        })
        .sort({ updatedAt: -1 })
        .lean();
      
      const activeCourses = enrollments.filter(
        (item) => item.status === "Active",
      ).length;
      const completedCourses = enrollments.filter(
        (item) => item.status === "Completed",
      ).length;
      
      const totalProgress = enrollments.reduce((sum, item) => sum + (item.progress || 0), 0);
      const averageProgress = enrollments.length
        ? Math.round(totalProgress / enrollments.length)
        : 0;

      const courseIds = enrollments
        .map((item) => item.courseId?._id || item.courseId)
        .filter(Boolean);

      const [publishedExams, submittedResults, certificatesEarned] =
        await Promise.all([
          courseIds.length
            ? Exam.find({ courseId: { $in: courseIds }, status: "Published" })
                .populate("courseId", "title")
                .sort({ createdAt: -1 })
                .lean()
            : [],
          courseIds.length
            ? ExamResult.find({ studentId, courseId: { $in: courseIds } })
                .populate("examId", "title")
                .populate("courseId", "title")
                .sort({ createdAt: -1 })
                .lean()
            : [],
          Certificate.countDocuments({ studentId }),
        ]);

      const myCourses = enrollments
        .filter((item) => item.courseId)
        .map((item) => ({
          courseId: String(item.courseId._id),
          title: item.courseId.title,
          categoryName: item.courseId.categoryId?.name || "Uncategorized",
          instructorName: item.courseId.instructorId?.name || "Instructor",
          image: item.courseId.thumbnail || "",
          progress: Math.round(item.progress || 0),
        }));

      const availableExams = publishedExams.map((exam) => ({
        examId: String(exam._id),
        title: exam.title,
        courseId: String(exam.courseId?._id || exam.courseId),
        courseTitle: exam.courseId?.title || "Course",
      }));

      const submittedExams = submittedResults.map((result) => {
        const percentage = Math.round(result.percentage || 0);

        return {
          examResultId: String(result._id),
          examId: String(result.examId?._id || result.examId),
          examTitle: result.examId?.title || "Assessment",
          courseId: String(result.courseId?._id || result.courseId),
          courseTitle: result.courseId?.title || "Course",
          score: percentage,
          percentage,
          startedAt: result.createdAt,
        };
      });

      res.json({
        stats: {
          totalCourses: enrollments.length,
          activeCourses,
          completedCourses,
          averageProgress,
          totalExams: publishedExams.length,
          certificatesEarned,
        },
        myCourses,
        availableExams,
        submittedExams,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

export default router;
