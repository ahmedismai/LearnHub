import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { User, Student, Instructor, Admin } from "../models/User.js";
import { ROLES } from "../constants/roles.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendConfirmationEmail = async (email, token, name) => {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  if (!process.env.SMTP_HOST || !smtpUser || !process.env.SMTP_PASS) {
    console.warn(
      "SMTP credentials are not configured. Skipping confirmation email.",
    );
    return;
  }

  const confirmUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/confirm-email?token=${token}&email=${encodeURIComponent(email)}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || smtpUser,
    to: email,
    subject: "LearnHub Email Confirmation",
    html: `
      <p>مرحباً ${name || "User"},</p>
      <p>الكود الخاص بتأكيد بريدك الإلكتروني هو:</p>
      <h2>${token}</h2>
      <p>يمكنك أيضاً تأكيد بريدك بالضغط على الرابط التالي:</p>
      <p><a href="${confirmUrl}">${confirmUrl}</a></p>
      <p>شكراً لاستخدام LearnHub.</p>
    `,
  });
};
const roleMap = {
  student: ROLES.STUDENT,
  instructor: ROLES.INSTRUCTOR,
  admin: ROLES.ADMINISTRATOR,
  administrator: ROLES.ADMINISTRATOR,
};

const createToken = (user, expiresIn = "1d") =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn,
  });

const buildUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  ...(user.role === ROLES.STUDENT && { studentId: user.studentId }),
  ...(user.role === ROLES.INSTRUCTOR && { instructorId: user.instructorId }),
  ...(user.role === ROLES.ADMINISTRATOR && { adminId: user.adminId }),
});

// Register
router.post("/Register", async (req, res) => {
  try {
    const { name, email, password, role = ROLES.STUDENT } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const normalizedRole = roleMap[String(role).toLowerCase()] || role;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const confirmationToken = crypto.randomBytes(24).toString("hex");

    const userData = {
      name,
      email,
      passwordHash,
      role: normalizedRole,
      confirmationToken,
    };

    let user;
    if (normalizedRole === ROLES.ADMINISTRATOR) {
      user = new Admin(userData);
    } else if (normalizedRole === ROLES.INSTRUCTOR) {
      user = new Instructor(userData);
    } else {
      user = new Student(userData);
    }

    await user.save();
    const accessToken = createToken(user);
    const refreshToken = crypto.randomBytes(32).toString("hex");
    user.refreshToken = refreshToken;
    await user.save();

    try {
      await sendConfirmationEmail(user.email, confirmationToken, user.name);
    } catch (emailError) {
      console.warn("Failed to send confirmation email:", emailError.message);
    }

    res.status(201).json({
      accessToken,
      refreshToken,
      user: buildUserResponse(user),
      confirmationToken,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm Email
router.get("/ConfirmEmail", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    const user = await User.findOne({ confirmationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.emailConfirmed = true;
    user.confirmationToken = "";
    await user.save();

    res.json({ message: "Email confirmed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm email code by email and token
router.post("/ConfirmEmailCode", async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ message: "Email and token are required" });
    }

    const user = await User.findOne({ email, confirmationToken: token });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid email or confirmation code" });
    }

    user.emailConfirmed = true;
    user.confirmationToken = "";
    await user.save();

    res.json({ message: "Email confirmed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend Confirm Email
router.post("/ResendConfirmEmail", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.emailConfirmed) {
      return res.status(400).json({ message: "Email is already confirmed" });
    }

    user.confirmationToken = crypto.randomBytes(24).toString("hex");
    await user.save();

    try {
      await sendConfirmationEmail(
        user.email,
        user.confirmationToken,
        user.name,
      );
    } catch (emailError) {
      console.warn("Failed to send confirmation email:", emailError.message);
    }

    res.json({
      message: "Confirmation token resent",
      confirmationToken: user.confirmationToken,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/Login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!user.emailConfirmed) {
      return res
        .status(403)
        .json({ message: "Email address is not confirmed" });
    }

    const accessToken = createToken(user);
    const refreshToken = crypto.randomBytes(32).toString("hex");
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, user: buildUserResponse(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh Token
router.post("/RefreshToken", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = createToken(user);
    const newRefreshToken = crypto.randomBytes(32).toString("hex");
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post("/Logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = "";
      await user.save();
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password
router.post("/ResetPassword", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.resetPasswordToken = crypto.randomBytes(24).toString("hex");
    user.resetPasswordExpires = Date.now() + 3600 * 1000;
    await user.save();

    res.json({
      message: "Password reset token generated",
      resetPasswordToken: user.resetPasswordToken,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm Reset Password
router.get("/ConfirmResetPassword", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    res.json({ message: "Reset token is valid" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New Password
router.post("/NewPassword", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get(
  "/Users",
  protect,
  authorize(ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const users = await User.find(
        {},
        "-passwordHash -refreshToken -confirmationToken -resetPasswordToken",
      );
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Delete user
router.delete(
  "/DeleteUser/:userId",
  protect,
  authorize(ROLES.ADMINISTRATOR),
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Get profile
router.get("/Account/GetProfile", protect, async (req, res) => {
  try {
    const user = await User.findById(
      req.user.id,
      "-passwordHash -refreshToken -confirmationToken -resetPasswordToken",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(buildUserResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put("/Account/UpdateProfile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.profileImage) user.profileImage = req.body.profileImage;
    if (req.body.bio && user.role === ROLES.INSTRUCTOR) {
      user.bio = req.body.bio;
    }
    await user.save();

    res.json(buildUserResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
