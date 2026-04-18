import express from "express";
import { User } from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();
const roleNames = new Set(Object.values(ROLES));

const normalizeRole = (roleName) => String(roleName || "").trim();

router.use(protect);
router.use(authorize(ROLES.ADMINISTRATOR));

router.get("/", (_req, res) => {
  res.json(Array.from(roleNames));
});

router.post("/:roleName", (req, res) => {
  const roleName = normalizeRole(req.params.roleName);
  if (!roleName) {
    return res.status(400).json({ message: "Role name is required" });
  }
  if (roleNames.has(roleName)) {
    return res.status(409).json({ message: "Role already exists" });
  }
  roleNames.add(roleName);
  res.status(201).json({ message: "Role created", role: roleName });
});

router.delete("/:roleName", (req, res) => {
  const roleName = normalizeRole(req.params.roleName);
  if (!roleNames.has(roleName)) {
    return res.status(404).json({ message: "Role not found" });
  }
  if (Object.values(ROLES).includes(roleName)) {
    return res.status(403).json({ message: "Cannot remove built-in role" });
  }
  roleNames.delete(roleName);
  res.json({ message: "Role removed", role: roleName });
});

router.post("/AssignRole/:userId/:roleName", async (req, res) => {
  try {
    const roleName = normalizeRole(req.params.roleName);
    if (!roleNames.has(roleName)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = roleName;
    await user.save();
    res.json({
      message: "Role assigned",
      user: { id: user.id, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/UnAssignRole/:userId/:roleName", async (req, res) => {
  try {
    const roleName = normalizeRole(req.params.roleName);
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== roleName) {
      return res
        .status(400)
        .json({ message: "User does not have the specified role" });
    }

    user.role = ROLES.STUDENT;
    await user.save();
    res.json({
      message: "Role unassigned",
      user: { id: user.id, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/RemoveAllRoles/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.role = ROLES.STUDENT;
    await user.save();
    res.json({
      message: "All roles removed",
      user: { id: user.id, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
