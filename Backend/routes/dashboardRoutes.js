import express from "express";
import mongoose from "mongoose";
import { Course } from "../models/Course.js";
import { Category } from "../models/Category.js";
import { Enrollment } from "../models/Enrollment.js";
import { Certificate } from "../models/Certificate.js";
import { Exam } from "../models/Exam.js";
import { ExamResult } from "../models/ExamResult.js";
import { Grade } from "../models/Grade.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get("/Public", async (_req, res) => {
  try {
    const [
      totalStudents,
      totalInstructors,
      totalCourses,
      totalEnrollments,
      totalCertificates,
      categories,
      instructors,
      reviews,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.INSTRUCTOR }),
      Course.countDocuments({ status: "Approved" }),
      Enrollment.countDocuments(),
      Certificate.countDocuments(),
      Category.aggregate([
        {
          $lookup: {
            from: "courses",
            let: { categoryId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$categoryId", "$$categoryId"] },
                  status: "Approved",
                },
              },
            ],
            as: "courses",
          },
        },
        {
          $project: {
            name: 1,
            description: 1,
            courseCount: { $size: "$courses" },
          },
        },
        { $sort: { courseCount: -1, name: 1 } },
      ]),
      User.aggregate([
        { $match: { role: ROLES.INSTRUCTOR } },
        {
          $lookup: {
            from: "courses",
            let: { instructorId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$instructorId", "$$instructorId"] },
                  status: "Approved",
                },
              },
            ],
            as: "courses",
          },
        },
        {
          $lookup: {
            from: "enrollments",
            localField: "courses._id",
            foreignField: "courseId",
            as: "enrollments",
          },
        },
        {
          $project: {
            name: 1,
            bio: 1,
            profileImage: 1,
            coursesCount: { $size: "$courses" },
            studentsCount: { $size: "$enrollments" },
          },
        },
        { $sort: { studentsCount: -1, coursesCount: -1, name: 1 } },
        { $limit: 3 },
      ]),
      Review.find()
        .populate("studentId", "name profileImage")
        .populate("courseId", "title")
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);

    res.json({
      stats: {
        totalStudents,
        totalInstructors,
        totalCourses,
        totalEnrollments,
        totalCertificates,
      },
      categories: categories.map((category) => ({
        categoryId: String(category._id),
        categoryName: category.name,
        description: category.description,
        courseCount: category.courseCount,
      })),
      instructors: instructors.map((instructor) => ({
        instructorId: String(instructor._id),
        name: instructor.name,
        bio: instructor.bio || "",
        profileImage: instructor.profileImage || "",
        coursesCount: instructor.coursesCount,
        studentsCount: instructor.studentsCount,
      })),
      testimonials: reviews.map((review) => ({
        reviewId: String(review._id),
        rating: review.rating,
        comment: review.comment,
        studentName: review.studentId?.name || "Student",
        studentImage: review.studentId?.profileImage || "",
        courseTitle: review.courseId?.title || "Course",
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

      const [publishedExams, submittedResults, submittedGrades, certificatesEarned] =
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
          courseIds.length
            ? Grade.find({ studentId, courseId: { $in: courseIds } })
                .populate("examId", "title")
                .populate("quizId", "title")
                .populate("assignmentId", "title")
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
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        examDate: exam.examDate,
        endDate: exam.endDate,
        courseId: String(exam.courseId?._id || exam.courseId),
        courseTitle: exam.courseId?.title || "Course",
      }));

      const examResultsByExamId = submittedResults.reduce((map, result) => {
        map.set(String(result.examId?._id || result.examId), result);
        return map;
      }, new Map());

      const submittedExams = submittedGrades.map((grade) => {
        const score = Math.round(grade.percentage ?? grade.score ?? 0);
        const assessment =
          grade.examId || grade.quizId || grade.assignmentId || {};
        const examResult = grade.examId
          ? examResultsByExamId.get(String(grade.examId?._id || grade.examId))
          : null;

        return {
          gradeId: String(grade._id),
          examResultId: examResult ? String(examResult._id) : null,
          examId: grade.examId ? String(grade.examId?._id || grade.examId) : null,
          courseId: String(grade.courseId?._id || grade.courseId),
          type: grade.type,
          examTitle: assessment.title || `${grade.type} Assessment`,
          courseTitle: grade.courseId?.title || "Course",
          score,
          percentage: score,
          aiFeedback: grade.aiFeedback || "",
          isReviewed: Boolean(grade.isReviewed),
          startedAt: grade.createdAt,
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
