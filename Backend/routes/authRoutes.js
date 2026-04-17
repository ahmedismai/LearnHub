import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Student, Instructor, Admin } from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { protect } from '../middleware/auth.js';

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
    const normalizedRole = roleMap[String(role).toLowerCase()] || role;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let user;
    const userData = { name, email, passwordHash: hashedPassword, role: normalizedRole };

    if (normalizedRole === ROLES.ADMINISTRATOR) {
      user = new Admin(userData);
    } else if (normalizedRole === ROLES.INSTRUCTOR) {
      user = new Instructor(userData);
    } else {
      user = new Student(userData);
    }

    await user.save();
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        ...(user.role === ROLES.STUDENT && { studentId: user.studentId }),
        ...(user.role === ROLES.INSTRUCTOR && { instructorId: user.instructorId }),
        ...(user.role === ROLES.ADMINISTRATOR && { adminId: user.adminId })
      },
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

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          ...(user.role === ROLES.STUDENT && { studentId: user.studentId }),
          ...(user.role === ROLES.INSTRUCTOR && { instructorId: user.instructorId }),
          ...(user.role === ROLES.ADMINISTRATOR && { adminId: user.adminId })
        } 
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Profile
router.patch('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    await user.updateProfile(req.body);
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      profileImage: user.profileImage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;