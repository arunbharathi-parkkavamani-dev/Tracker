import express from 'express';
import { authMiddleware } from '../middlewares/autmiddleware.js';
import { upload, handleFileUpload } from '../middlewares/multerConfig.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// Profile image upload
router.post('/profile/:id', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Generate file path
    const folder = 'profile';
    const filePath = `documents/${folder}/${req.file.filename}`;
    
    // Update employee profile image
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { 'basicInfo.profileImage': filePath },
      { new: true }
    );
    
    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: filePath,
        filename: req.file.filename
      }
    });
    
  } catch (error) {
    console.error('Profile upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image'
    });
  }
});

// General file upload
router.post('/document', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Generate file path
    const folder = 'general';
    const filePath = `documents/${folder}/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filePath: filePath,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
});

export default router;