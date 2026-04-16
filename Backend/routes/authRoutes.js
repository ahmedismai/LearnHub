import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();
const roleMap = {
  student: ROLES.STUDENT,
  instructor: ROLES.INSTRUCTOR,
  admin: ROLES.ADMINISTRATOR,
  administrator: ROLES.ADMINISTRATOR,
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = ROLES.STUDENT } = req.body;
    const normalizedRole =
      roleMap[String(role).toLowerCase()] || role;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: normalizedRole });
    await user.save();
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;