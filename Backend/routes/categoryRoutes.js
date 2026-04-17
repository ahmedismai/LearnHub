import express from "express";
import { Category } from "../models/Category.js";
import { protect, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/",
  protect,
  authorize(ROLES.ADMINISTRATOR, ROLES.INSTRUCTOR),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const category = new Category({ name, description });
      await category.save();
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;