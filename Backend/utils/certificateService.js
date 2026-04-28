import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { v2 as cloudinary } from "cloudinary";
import { Certificate } from "../models/Certificate.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";

/**
 * Generates a professional certificate PDF and uploads it to Cloudinary.
 */
export const generateAndUploadCertificate = async (studentId, courseId) => {
  try {
    // 1. Check if certificate already exists
    const existingCert = await Certificate.findOne({ studentId, courseId });
    if (existingCert && existingCert.certificateUrl) {
      return existingCert.certificateUrl;
    }

    // 2. Fetch Student and Course Details
    const student = await User.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !course) {
      throw new Error("Student or Course not found");
    }

    // 3. Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 Landscape
    const { width, height } = page.getSize();

    // Load Font
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Draw Background/Border (Simple professional look)
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: rgb(0, 0.45, 0.85), // LearnHub Blue
      borderWidth: 10,
    });

    // Header
    page.drawText("CERTIFICATE OF COMPLETION", {
      x: width / 2 - 180,
      y: height - 120,
      size: 30,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("This is to certify that", {
      x: width / 2 - 80,
      y: height - 180,
      size: 18,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Student Name
    const nameText = student.name || "Student Name";
    const nameWidth = boldFont.widthOfTextAtSize(nameText, 40);
    page.drawText(nameText, {
      x: width / 2 - nameWidth / 2,
      y: height - 250,
      size: 40,
      font: boldFont,
      color: rgb(0, 0.45, 0.85),
    });

    page.drawText("has successfully completed the course", {
      x: width / 2 - 150,
      y: height - 310,
      size: 18,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Course Title
    const courseText = course.title || "Course Title";
    const courseWidth = boldFont.widthOfTextAtSize(courseText, 25);
    page.drawText(courseText, {
      x: width / 2 - courseWidth / 2,
      y: height - 360,
      size: 25,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Date
    const dateText = `Issued on: \${new Date().toLocaleDateString()}`;
    page.drawText(dateText, {
      x: 60,
      y: 80,
      size: 14,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // ID
    page.drawText("Verified by LearnHub AI", {
      x: width - 250,
      y: 80,
      size: 14,
      font: boldFont,
      color: rgb(0, 0.45, 0.85),
    });

    // 4. Save PDF and Upload to Cloudinary
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const dataUri = `data:application/pdf;base64,\${pdfBase64}`;

    const uploadResponse = await cloudinary.uploader.upload(dataUri, {
      folder: "learnhub/certificates",
      resource_type: "raw", // Required for PDFs
      public_id: `cert_\${studentId}_\${courseId}`,
      format: "pdf"
    });

    // 5. Save/Update Certificate in Database
    if (existingCert) {
      existingCert.certificateUrl = uploadResponse.secure_url;
      existingCert.issueDate = new Date();
      await existingCert.save();
    } else {
      await Certificate.create({
        studentId,
        courseId,
        certificateUrl: uploadResponse.secure_url,
        issueDate: new Date(),
      });
    }

    return uploadResponse.secure_url;
  } catch (error) {
    console.error("[CERTIFICATE-SERVICE-ERROR]:", error);
    throw error;
  }
};
