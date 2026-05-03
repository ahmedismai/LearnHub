import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { v2 as cloudinary } from "cloudinary";
import { Certificate } from "../models/Certificate.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import axios from "axios";

// Fonts from Google Fonts
const PLAYWRITE_FONT_URL =
  "https://fonts.gstatic.com/s/playwriteza/v1/D78vXNm9p9S7u7U.ttf";
const OUTFIT_FONT_URL =
  "https://fonts.gstatic.com/s/outfit/v11/QGYsz_OBy1qW9dz3.ttf";
const OUTFIT_BOLD_URL =
  "https://fonts.gstatic.com/s/outfit/v11/QGYxz_OBy1qW9dz3.ttf";

/**
 * Generates a professional certificate PDF and uploads it to Cloudinary.
 */
export const generateAndUploadCertificate = async (studentId, courseId) => {
  try {
    const student = await User.findById(studentId);
    const course = await Course.findById(courseId).populate("instructorId");

    if (!student || !course) {
      throw new Error("Student or Course not found");
    }

    const instructorName =
      course.instructorId?.signatureText ||
      course.instructorId?.name ||
      "Lead Instructor";

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const { width, height } = page.getSize();

    // Default Fallbacks
    let regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let signatureFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    let signatureSize = 32;

    // Load Custom Fonts
    try {
      const [playwriteRes, outfitRes, outfitBoldRes] = await Promise.all([
        axios.get(PLAYWRITE_FONT_URL, { responseType: "arraybuffer" }),
        axios.get(OUTFIT_FONT_URL, { responseType: "arraybuffer" }),
        axios.get(OUTFIT_BOLD_URL, { responseType: "arraybuffer" }),
      ]);

      signatureFont = await pdfDoc.embedFont(playwriteRes.data);
      regularFont = await pdfDoc.embedFont(outfitRes.data);
      boldFont = await pdfDoc.embedFont(outfitBoldRes.data);
      signatureSize = 32;
    } catch (error) {
      console.warn(
        "[CERT-GEN] Font loading failed, using fallbacks:",
        error.message,
      );
    }

    // Colors
    const primaryBlue = rgb(0.06, 0.09, 0.16);
    const accentTeal = rgb(0.05, 0.6, 0.6);
    const goldColor = rgb(0.85, 0.65, 0.13);
    const lightGray = rgb(0.95, 0.95, 0.95);
    const deepInkBlue = rgb(0, 0.176, 0.384); // #002D62

    // --- Background & Borders ---
    page.drawRectangle({ x: 0, y: 0, width, height, color: lightGray });
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
      font: regularFont,
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

    const completionText =
      "has successfully fulfilled all requirements and completed the course";
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

    // Instructor Signature - Deep Fluid Ink Blue, Overlapping line
    page.drawText(instructorName, {
      x: width - 280,
      y: 118,
      size: signatureSize,
      font: signatureFont,
      color: deepInkBlue,
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
