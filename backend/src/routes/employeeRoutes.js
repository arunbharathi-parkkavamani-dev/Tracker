import express from "express";
import { authMiddleware } from "../Controller/AuthController.js";
import Employee from "../models/Employee.js";

const router = express.Router();

// Get all employees (HR only)
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const employees = await Employee.find()
      .populate('professionalInfo.designation')
      .populate('professionalInfo.department')
      .populate('professionalInfo.role')
      .select('-authInfo.password');
    res.json({ success: true, data: employees });
  } catch (err) {
    next(err);
  }
});

// Get employee profile
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.user.id)
      .populate('professionalInfo.designation')
      .populate('professionalInfo.department')
      .populate('professionalInfo.role')
      .select('-authInfo.password');
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
});

// Update employee profile
router.put("/me", authMiddleware, async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-authInfo.password');
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
});

export default router;