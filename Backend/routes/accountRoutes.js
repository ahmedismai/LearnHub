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

  const confirmUrl = `${getFrontendUrl()}/confirm-email?token=${token}&email=${encodeURIComponent(email)}`;
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

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:8080").replace(/\/$/, "");

const getBackendUrl = (req) =>
  (process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`).replace(
    /\/$/,
    "",
  );

const getOAuthRedirectUri = (req, provider) =>
  `${getBackendUrl(req)}/api/Account/oauth/${provider}/callback`;

const createAuthPayload = async (user) => {
  const accessToken = createToken(user);
  const refreshToken = crypto.randomBytes(32).toString("hex");
  user.refreshToken = refreshToken;
  await user.save();
  return { accessToken, refreshToken, user: buildUserResponse(user) };
};

const buildUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  emailConfirmed: user.emailConfirmed,
  ...(user.role === ROLES.STUDENT && { studentId: user.studentId }),
  ...(user.role === ROLES.INSTRUCTOR && {
    instructorId: user.instructorId,
    bio: user.bio,
    signatureText: user.signatureText,
  }),
  ...(user.role === ROLES.ADMINISTRATOR && { adminId: user.adminId }),
});

const redirectOAuthError = (res, message) => {
  const url = new URL("/oauth/callback", getFrontendUrl());
  url.searchParams.set("error", message);
  return res.redirect(url.toString());
};

const redirectOAuthSuccess = (res, payload) => {
  const url = new URL("/oauth/callback", getFrontendUrl());
  url.searchParams.set("accessToken", payload.accessToken);
  url.searchParams.set("refreshToken", payload.refreshToken);
  url.searchParams.set("user", JSON.stringify(payload.user));
  return res.redirect(url.toString());
};

const getOAuthRole = (role) =>
  roleMap[String(role || "").toLowerCase()] || ROLES.STUDENT;

const upsertOAuthUser = async ({
  provider,
  providerId,
  email,
  name,
  profileImage,
  role,
}) => {
  if (!email) {
    throw new Error("No verified email was returned by the OAuth provider");
  }

  const providerField = provider === "google" ? "googleId" : "githubId";
  const existingUser =
    (providerId && (await User.findOne({ [providerField]: providerId }))) ||
    (await User.findOne({ email }));

  if (existingUser) {
    existingUser[providerField] = providerId || existingUser[providerField];
    existingUser.authProvider = existingUser.authProvider || provider;
    existingUser.emailConfirmed = true;
    existingUser.profileImage = existingUser.profileImage || profileImage || "";
    await existingUser.save();
    return existingUser;
  }

  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
  const userData = {
    name: name || email.split("@")[0],
    email,
    passwordHash,
    role: getOAuthRole(role),
    profileImage: profileImage || "",
    emailConfirmed: true,
    confirmationToken: "",
    authProvider: provider,
    [providerField]: providerId || "",
  };

  if (userData.role === ROLES.INSTRUCTOR) {
    return Instructor.create(userData);
  }
  return Student.create(userData);
};

const exchangeOAuthCode = async ({ tokenUrl, params }) => {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || "OAuth token exchange failed");
  }
  return data;
};

const fetchJson = async (url, accessToken) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "User-Agent": "LearnHub",
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.message || "OAuth profile request failed");
  }
  return data;
};

router.get("/oauth/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured" });
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", getOAuthRedirectUri(req, "google"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set(
    "state",
    Buffer.from(JSON.stringify({ role: req.query.role || ROLES.STUDENT })).toString("base64url"),
  );
  return res.redirect(url.toString());
});

router.get("/oauth/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return redirectOAuthError(res, "Missing Google authorization code");
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return redirectOAuthError(res, "Google OAuth is not configured");
    }

    const tokenData = await exchangeOAuthCode({
      tokenUrl: "https://oauth2.googleapis.com/token",
      params: {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: getOAuthRedirectUri(req, "google"),
        grant_type: "authorization_code",
      },
    });
    const profile = await fetchJson(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      tokenData.access_token,
    );
    const stateData = state
      ? JSON.parse(Buffer.from(String(state), "base64url").toString("utf8"))
      : {};
    const user = await upsertOAuthUser({
      provider: "google",
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
      profileImage: profile.picture,
      role: stateData.role,
    });
    return redirectOAuthSuccess(res, await createAuthPayload(user));
  } catch (error) {
    console.error("Google OAuth error:", error);
    return redirectOAuthError(res, error.message || "Google sign-in failed");
  }
});

router.get("/oauth/github", (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(500).json({ message: "GITHUB_CLIENT_ID is not configured" });
  }

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", getOAuthRedirectUri(req, "github"));
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set(
    "state",
    Buffer.from(JSON.stringify({ role: req.query.role || ROLES.STUDENT })).toString("base64url"),
  );
  return res.redirect(url.toString());
});

router.get("/oauth/github/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return redirectOAuthError(res, "Missing GitHub authorization code");
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return redirectOAuthError(res, "GitHub OAuth is not configured");
    }

    const tokenData = await exchangeOAuthCode({
      tokenUrl: "https://github.com/login/oauth/access_token",
      params: {
        code,
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        redirect_uri: getOAuthRedirectUri(req, "github"),
      },
    });
    const profile = await fetchJson("https://api.github.com/user", tokenData.access_token);
    const emails = await fetchJson(
      "https://api.github.com/user/emails",
      tokenData.access_token,
    );
    const primaryEmail =
      emails.find((item) => item.primary && item.verified)?.email ||
      emails.find((item) => item.verified)?.email;
    const stateData = state
      ? JSON.parse(Buffer.from(String(state), "base64url").toString("utf8"))
      : {};
    const user = await upsertOAuthUser({
      provider: "github",
      providerId: String(profile.id),
      email: primaryEmail,
      name: profile.name || profile.login,
      profileImage: profile.avatar_url,
      role: stateData.role,
    });
    return redirectOAuthSuccess(res, await createAuthPayload(user));
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return redirectOAuthError(res, error.message || "GitHub sign-in failed");
  }
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

    const accessToken = createToken(user);
    const refreshToken = crypto.randomBytes(32).toString("hex");
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: "Email confirmed successfully",
      accessToken,
      refreshToken,
      user: buildUserResponse(user),
    });
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

    const accessToken = createToken(user);
    const refreshToken = crypto.randomBytes(32).toString("hex");
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: "Email confirmed successfully",
      accessToken,
      refreshToken,
      user: buildUserResponse(user),
    });
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

    // Define allowed fields for everyone
    const allowedUpdates = ["name", "profileImage"];

    // Define instructor-only fields
    if (user.role === ROLES.INSTRUCTOR) {
      allowedUpdates.push("bio", "signatureText");
    }

    // Filter req.body to only include allowed fields
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Use user.set() with strict: false to allow fields from discriminators
    // when searching via the base model
    user.set(updates, { strict: false });

    await user.save();

    res.json(buildUserResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
