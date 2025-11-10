import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Buat direktori uploads
const uploadsDir = path.join(process.cwd(), 'src', 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const productsDir = path.join(uploadsDir, 'products');
const stocksDir = path.join(uploadsDir, 'stocks');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}
if (!fs.existsSync(stocksDir)) {
  fs.mkdirSync(stocksDir, { recursive: true });
}

// Konfigurasi penyimpanan multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profileImage') {
      cb(null, profilesDir);
    } else if (file.fieldname === 'productImage') {
      cb(null, productsDir);
    } else if (file.fieldname === 'stockImage') {
      cb(null, stocksDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    // Membuat nama file 
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter file untuk gambar
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only one file per request for registration
  },
  fileFilter: fileFilter,
});

// Fungsi cleanup untuk file temp
export const cleanupTempFiles = () => {
  const tempDir = path.join(os.tmpdir(), 'uploads');
  if (fs.existsSync(tempDir)) {
    fs.readdir(tempDir, (err, files) => {
      if (err) return;
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          // Remove files older than 1 hour
          if (Date.now() - stats.mtime.getTime() > 60 * 60 * 1000) {
            fs.unlink(filePath, () => {});
          }
        });
      });
    });
  }
};

// Jalankan cleanup setiap jam
setInterval(cleanupTempFiles, 60 * 60 * 1000);
