import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { v2 as cloudinary } from "cloudinary";
import { Certificate } from "../models/Certificate.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";

/**
 * Generates a professional certificate PDF and uploads it to Cloudinary.
 * Features: Dynamic instructor name, secure path naming, and auto-sync with DB.
 */
export const generateAndUploadCertificate = async (studentId, courseId) => {
  try {
    // 1. Fetch Student and Course Details (with Instructor population)
    const student = await User.findById(studentId);
    const course = await Course.findById(courseId).populate("instructor");

    if (!student || !course) {
      throw new Error("Student or Course not found");
    }

    const instructorName = course.instructor?.name || "Lead Instructor";

    // 2. Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 Landscape (عرضي)
    const { width, height } = page.getSize();

    // Load Fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Colors
    const primaryBlue = rgb(0.06, 0.09, 0.16); // Dark Slate
    const accentTeal = rgb(0.05, 0.6, 0.6); // Teal
    const goldColor = rgb(0.85, 0.65, 0.13); // Goldenrod
    const lightGray = rgb(0.95, 0.95, 0.95);

    // --- Background & Borders ---
    // Main Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: lightGray,
    });

    // Outer Decorative Border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: primaryBlue,
      borderWidth: 3,
    });

    // Inner Decorative Border
    page.drawRectangle({
      x: 45,
      y: 45,
      width: width - 90,
      height: height - 90,
      borderColor: goldColor,
      borderWidth: 1.5,
    });

    // --- Content ---

    // LearnHub Logo/Brand Header
    const brandText = "LEARNHUB ACADEMY";
    const brandSize = 24;
    const brandWidth = boldFont.widthOfTextAtSize(brandText, brandSize);
    page.drawText(brandText, {
      x: width / 2 - brandWidth / 2,
      y: height - 100,
      size: brandSize,
      font: boldFont,
      color: accentTeal,
    });

    // Main Title
    const titleText = "CERTIFICATE OF COMPLETION";
    const titleSize = 36;
    const titleWidth = boldFont.widthOfTextAtSize(titleText, titleSize);
    page.drawText(titleText, {
      x: width / 2 - titleWidth / 2,
      y: height - 160,
      size: titleSize,
      font: boldFont,
      color: primaryBlue,
    });

    // Subtitle
    const subText = "This is to officially certify that";
    const subSize = 18;
    const subWidth = regularFont.widthOfTextAtSize(subText, subSize);
    page.drawText(subText, {
      x: width / 2 - subWidth / 2,
      y: height - 210,
      size: subSize,
      font: italicFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Student Name
    const nameText = student.name?.toUpperCase() || "LEARNER NAME";
    const nameSize = 48;
    const nameWidth = boldFont.widthOfTextAtSize(nameText, nameSize);
    page.drawText(nameText, {
      x: width / 2 - nameWidth / 2,
      y: height - 280,
      size: nameSize,
      font: boldFont,
      color: accentTeal,
    });

    // Completion Text
    const completionText =
      "has successfully fulfilled all requirements and completed the course";
    const completionSize = 16;
    const completionWidth = regularFont.widthOfTextAtSize(
      completionText,
      completionSize,
    );
    page.drawText(completionText, {
      x: width / 2 - completionWidth / 2,
      y: height - 330,
      size: completionSize,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Course Title
    const courseText = course.title || "COURSE TITLE";
    const courseSize = 28;
    const courseWidth = boldFont.widthOfTextAtSize(courseText, courseSize);
    page.drawText(courseText, {
      x: width / 2 - courseWidth / 2,
      y: height - 380,
      size: courseSize,
      font: boldFont,
      color: primaryBlue,
    });

    // --- Footer Section ---

    // Date
    const dateText = `Date of Issue: ${new Date().toLocaleDateString()}`;
    page.drawText(dateText, {
      x: 100,
      y: 120,
      size: 14,
      font: boldFont,
      color: primaryBlue,
    });

    // Date Underline
    page.drawLine({
      start: { x: 100, y: 115 },
      end: { x: 280, y: 115 },
      thickness: 1,
      color: primaryBlue,
    });

    // Dynamic Instructor Signature
    page.drawText(instructorName, {
      x: width - 280,
      y: 120,
      size: 16,
      font: italicFont,
      color: accentTeal,
    });
    page.drawText(`Instructor, LearnHub Academy`, {
      x: width - 280,
      y: 100,
      size: 12,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Signature Line
    page.drawLine({
      start: { x: width - 280, y: 125 },
      end: { x: width - 100, y: 125 },
      thickness: 1,
      color: primaryBlue,
    });

    // Decorative Seal
    page.drawCircle({
      x: width / 2,
      y: 110,
      size: 40,
      color: goldColor,
      borderColor: primaryBlue,
      borderWidth: 2,
    });
    const sealText = "OFFICIAL";
    const sealTextSize = 10;
    const sealTextWidth = boldFont.widthOfTextAtSize(sealText, sealTextSize);
    page.drawText(sealText, {
      x: width / 2 - sealTextWidth / 2,
      y: 105,
      size: sealTextSize,
      font: boldFont,
      color: primaryBlue,
    });

    // 3. Save PDF and Upload to Cloudinary
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const dataUri = `data:application/pdf;base64,${pdfBase64}`;

    const uploadResponse = await cloudinary.uploader.upload(dataUri, {
      resource_type: "auto",
      public_id: `learnhub/certificates/cert_${studentId}_${courseId}_${Date.now()}`,
      format: "pdf",
      overwrite: true,
      invalidate: true,
    });

    // 4. Update Database
    const existingCert = await Certificate.findOne({ studentId, courseId });
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
