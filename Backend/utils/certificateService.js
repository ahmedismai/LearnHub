import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { v2 as cloudinary } from "cloudinary";
import { Certificate } from "../models/Certificate.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import axios from "axios";

// Decorative font for signature (Playwrite ZA is a modern elegant handwriting font)
const DECORATIVE_FONT_URL = "https://github.com/google/fonts/raw/main/ofl/playwriteza/PlaywriteZA-VariableFont_wght.ttf";

/**
 * Generates a professional certificate PDF and uploads it to Cloudinary.
 * Features: Dynamic instructor name, secure path naming, and auto-sync with DB.
 */
export const generateAndUploadCertificate = async (studentId, courseId) => {
  try {
    // 1. Fetch Student and Course Details (with Instructor population)
    const student = await User.findById(studentId);
    const course = await Course.findById(courseId).populate("instructorId");

    if (!student || !course) {
      throw new Error("Student or Course not found");
    }

    const instructorName = course.instructorId?.name || "Lead Instructor";

    // 2. Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const { width, height } = page.getSize();

    // Load Fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Load Decorative Font for Signature
    let signatureFont = italicFont;
    let signatureSize = 48; // Larger for the script font
    try {
      console.log(`[CERT-GEN] Fetching decorative font from: ${DECORATIVE_FONT_URL}`);
      const fontResponse = await axios.get(DECORATIVE_FONT_URL, { responseType: 'arraybuffer' });
      signatureFont = await pdfDoc.embedFont(fontResponse.data);
      console.log("[CERT-GEN] Decorative font loaded successfully.");
    } catch (error) {
      console.warn("[CERT-GEN] Could not load decorative font, falling back to standard italic:", error.message);
      signatureSize = 24; // Standard font size
    }

    // Colors
    const primaryBlue = rgb(0.06, 0.09, 0.16); // Dark Slate
    const accentTeal = rgb(0.05, 0.6, 0.6); // Teal
    const goldColor = rgb(0.85, 0.65, 0.13); // Goldenrod
    const lightGray = rgb(0.95, 0.95, 0.95);
    const signatureBlue = rgb(0, 0.2, 0.6); // Vibrant Royal Blue

    // --- Background & Borders ---
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: lightGray,
    });

    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: primaryBlue,
      borderWidth: 3,
    });

    page.drawRectangle({
      x: 45,
      y: 45,
      width: width - 90,
      height: height - 90,
      borderColor: goldColor,
      borderWidth: 1.5,
    });

    // --- Content ---
    const brandText = "LEARNHUB ACADEMY";
    const brandWidth = boldFont.widthOfTextAtSize(brandText, 24);
    page.drawText(brandText, {
      x: width / 2 - brandWidth / 2,
      y: height - 100,
      size: 24,
      font: boldFont,
      color: accentTeal,
    });

    const titleText = "CERTIFICATE OF COMPLETION";
    const titleWidth = boldFont.widthOfTextAtSize(titleText, 36);
    page.drawText(titleText, {
      x: width / 2 - titleWidth / 2,
      y: height - 160,
      size: 36,
      font: boldFont,
      color: primaryBlue,
    });

    const subText = "This is to officially certify that";
    const subWidth = regularFont.widthOfTextAtSize(subText, 18);
    page.drawText(subText, {
      x: width / 2 - subWidth / 2,
      y: height - 210,
      size: 18,
      font: italicFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    const nameText = student.name?.toUpperCase() || "LEARNER NAME";
    const nameWidth = boldFont.widthOfTextAtSize(nameText, 48);
    page.drawText(nameText, {
      x: width / 2 - nameWidth / 2,
      y: height - 280,
      size: 48,
      font: boldFont,
      color: accentTeal,
    });

    const completionText = "has successfully fulfilled all requirements and completed the course";
    const completionWidth = regularFont.widthOfTextAtSize(completionText, 16);
    page.drawText(completionText, {
      x: width / 2 - completionWidth / 2,
      y: height - 330,
      size: 16,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    const courseText = course.title || "COURSE TITLE";
    const courseWidth = boldFont.widthOfTextAtSize(courseText, 28);
    page.drawText(courseText, {
      x: width / 2 - courseWidth / 2,
      y: height - 380,
      size: 28,
      font: boldFont,
      color: primaryBlue,
    });

    // --- Footer ---
    const dateText = `Date of Issue: ${new Date().toLocaleDateString()}`;
    page.drawText(dateText, {
      x: 100,
      y: 120,
      size: 14,
      font: boldFont,
      color: primaryBlue,
    });

    page.drawLine({
      start: { x: 100, y: 115 },
      end: { x: 280, y: 115 },
      thickness: 1,
      color: primaryBlue,
    });

    // Instructor Signature
    page.drawText(instructorName, {
      x: width - 280,
      y: 135,
      size: signatureSize,
      font: signatureFont,
      color: signatureBlue,
      rotate: degrees(-3),
    });

    page.drawText(`Instructor, LearnHub Academy`, {
      x: width - 280,
      y: 100,
      size: 12,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawLine({
      start: { x: width - 280, y: 120 },
      end: { x: width - 100, y: 120 },
      thickness: 1,
      color: primaryBlue,
    });

    page.drawCircle({
      x: width / 2,
      y: 110,
      size: 40,
      color: goldColor,
      borderColor: primaryBlue,
      borderWidth: 2,
    });

    const sealText = "OFFICIAL";
    const sealTextWidth = boldFont.widthOfTextAtSize(sealText, 10);
    page.drawText(sealText, {
      x: width / 2 - sealTextWidth / 2,
      y: 105,
      size: 10,
      font: boldFont,
      color: primaryBlue,
    });

    // 3. Save PDF and Upload
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const dataUri = `data:application/pdf;base64,${pdfBase64}`;

    const uploadResponse = await cloudinary.uploader.upload(dataUri, {
      resource_type: "auto",
      access_mode: "public",
      folder: "learnhub/certificates",
      public_id: `cert_${studentId}_${courseId}_${Date.now()}`,
      format: "pdf",
      overwrite: true,
      invalidate: true,
    });

    // 4. Update Database with Cache Buster
    const finalUrl = `${uploadResponse.secure_url}?v=${Date.now()}`;
    const existingCert = await Certificate.findOne({ studentId, courseId });
    if (existingCert) {
      existingCert.certificateUrl = finalUrl;
      existingCert.issueDate = new Date();
      await existingCert.save();
    } else {
      await Certificate.create({
        studentId,
        courseId,
        certificateUrl: finalUrl,
        issueDate: new Date(),
      });
    }

    return finalUrl;
  } catch (error) {
    console.error("[CERTIFICATE-SERVICE-ERROR]:", error);
    throw error;
  }
};
