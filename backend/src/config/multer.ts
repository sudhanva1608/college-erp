import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Ensure uploads folder exists in root of backend project
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// File filter to accept safe file types including Word and PDF
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = /jpeg|jpg|png|gif|pdf|doc|docx|txt|ppt|pptx|xls|xlsx/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const extValid = allowedExtensions.test(ext);

  // Accept by extension — mime types for docx/xlsx can vary by OS
  if (extValid) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only specific file types are allowed (Excel, Word, PDF, images)!'));
  }
};

// Sanitize filename to prevent path traversal
const sanitizeFilename = (filename: string): string => {
  const name = filename.replace(/^.*[\\/]/, '');
  return name.replace(/[^\w.\-]/g, '_');
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = sanitizeFilename(file.originalname);
    cb(null, uniqueSuffix + '-' + sanitizedName);
  },
});

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});
