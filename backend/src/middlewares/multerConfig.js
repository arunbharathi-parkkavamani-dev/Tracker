import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create documents directory structure
const createDirectories = () => {
  const baseDir = path.join(__dirname, '../../documents');
  const profileDir = path.join(baseDir, 'profile');
  const generalDir = path.join(baseDir, 'general');
  
  [baseDir, profileDir, generalDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirectories();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = path.join(__dirname, '../../documents');
    let uploadDir;
    
    // Determine upload directory based on route or field
    if (req.route.path.includes('profile') || file.fieldname === 'profileImage') {
      uploadDir = path.join(baseDir, 'profile');
    } else {
      uploadDir = path.join(baseDir, 'general');
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${extension}`;
    
    // Store the generated filename in request for later use
    req.uploadedFileName = filename;
    
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images and documents
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware to handle file path generation
const handleFileUpload = (req, res, next) => {
  if (req.file) {
    // Generate the relative path to store in database
    const folder = req.route.path.includes('profile') || req.file.fieldname === 'profileImage' ? 'profile' : 'general';
    req.filePath = `documents/${folder}/${req.file.filename}`;
  }
  next();
};

export { upload, handleFileUpload };