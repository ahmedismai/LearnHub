import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import accountRoutes from "./routes/accountRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import gradeRoutes from "./routes/gradeRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import examResultRoutes from "./routes/examResultRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import aiAssessmentRoutes from "./routes/aiAssessmentRoutes.js";
import examLifecycleRoutes from "./routes/examLifecycleRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import cors from "cors";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// THE ULTIMATE CORS FIX: Set headers manually at the very top for EVERY response
app.use(cors());

app.use(express.json());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/Account", accountRoutes);
app.use("/api/Course", courseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/Quiz", quizRoutes);
app.use("/api/Assignment", assignmentRoutes);
app.use("/api/Enrollment", enrollmentRoutes);
app.use("/api/Grade", gradeRoutes);
app.use("/api/Certificate", certificateRoutes);
app.use("/api/Category", categoryRoutes);
app.use("/api/Review", reviewRoutes);
app.use("/api/Dashboard", dashboardRoutes);
app.use("/api/Role", roleRoutes);
app.use("/api/Chatbot", chatbotRoutes);
app.use("/api/Section", sectionRoutes);
app.use("/api/Lesson", lessonRoutes);
app.use("/api/Exam", examRoutes);
app.use("/api/ExamResult", examResultRoutes);
app.use("/api/Order", orderRoutes);
app.use("/api/AI-Assessment", aiAssessmentRoutes);
app.use("/api/Exam-Lifecycle", examLifecycleRoutes);

app.get("/", (req, res) => {
  res.send("LearnHub Server is Running Successfully! 🚀");
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("MONGO_URI is missing in environment variables.");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("Connected to MongoDB");

    // CLEANUP: Drop problematic legacy unique indexes in various collections
    try {
      const db = mongoose.connection.db;

      // Clean up 'submissions' collection
      const submissionsCols = await db
        .listCollections({ name: "submissions" })
        .toArray();
      if (submissionsCols.length > 0) {
        try {
          await db
            .collection("submissions")
            .dropIndex("studentId_1_assignmentId_1");
          console.log(
            "Successfully dropped legacy unique index: submissions.studentId_1_assignmentId_1",
          );
        } catch (e) {
          /* ignore */
        }
      }

      // Clean up 'grades' collection - CRITICAL: fixes E11000 duplicate key errors
      const gradesCols = await db.listCollections({ name: "grades" }).toArray();
      if (gradesCols.length > 0) {
        const legacyIndexes = [
          "studentId_1_quizId_1",
          "studentId_1_examId_1",
          "studentId_1_assignmentId_1",
          "studentId_1_quizId_1_v2",
        ];

        for (const indexName of legacyIndexes) {
          try {
            await db.collection("grades").dropIndex(indexName);
            console.log(
              `Successfully dropped legacy unique index: grades.${indexName}`,
            );
          } catch (e) {
            // Silence IndexNotFound errors
          }
        }
      }
    } catch (err) {
      console.error("Cleanup Note:", err.message);
    }

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Mongo connection failed:", error);
    process.exit(1);
  });

export default app;
