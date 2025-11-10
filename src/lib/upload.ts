import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import type { Request } from 'express';
import type { Express } from 'express';

// Ukuran file maksimal per gambar (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Magic bytes buat validasi file gambar (untuk keamanan)
const IMAGE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
  'image/jpg': [0xFF, 0xD8, 0xFF] // JPG sama kayak JPEG
};

// Dimensi gambar maksimal (agar tidak terlalu besar)
const MAX_WIDTH = 4096;
const MAX_HEIGHT = 4096;

export const saveUploadedFile = async (file: fileUpload.UploadedFile, destination: string): Promise<string> => {
  const uploadDir = path.join(process.cwd(), 'uploads', destination);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${Date.now()}-${file.name}`;
  const filePath = path.join(uploadDir, fileName);

  await file.mv(filePath);
  return `/uploads/${destination}/${fileName}`;
};

export const validateImageFile = (file: fileUpload.UploadedFile | Express.Multer.File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];

  // Cek MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return false;
  }

  // Cek ukuran file
  if (file.size > MAX_FILE_SIZE) {
    return false;
  }

  // Buat file multer
  if ('path' in file && file.path) {
    try {
      const buffer = fs.readFileSync(file.path);

      if (!buffer || buffer.length === 0) {
        return false;
      }

      const signature = IMAGE_SIGNATURES[file.mimetype as keyof typeof IMAGE_SIGNATURES];

      if (!signature) {
        return false;
      }

      // Cek apakah file dimulai dengan magic bytes yang benar
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
          return false;
        }
      }

      // Keamanan tambahan: Cek script atau konten berbahaya yang embedded
      // Cari pola mencurigakan di 1KB pertama
      const firstKB = buffer.slice(0, 1024).toString('ascii', 0, 1024).toLowerCase();
      const suspiciousPatterns = ['<script', 'javascript:', 'vbscript:', 'onload=', 'onerror='];

      for (const pattern of suspiciousPatterns) {
        if (firstKB.includes(pattern)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error baca file buat validasi:', error);
      return false;
    }
  }

  // Buat file fileUpload, pakai logika yang ada
  const buffer = 'data' in file ? file.data : file.buffer;

  if (!buffer || buffer.length === 0) {
    return false;
  }

  const signature = IMAGE_SIGNATURES[file.mimetype as keyof typeof IMAGE_SIGNATURES];

  if (!signature) {
    return false;
  }

  // Cek apakah file dimulai dengan magic bytes yang benar
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }

  // Keamanan tambahan: Cek script atau konten berbahaya yang embedded
  // Cari pola mencurigakan di 1KB pertama
  const firstKB = buffer.slice(0, 1024).toString('ascii', 0, 1024).toLowerCase();
  const suspiciousPatterns = ['<script', 'javascript:', 'vbscript:', 'onload=', 'onerror='];

  for (const pattern of suspiciousPatterns) {
    if (firstKB.includes(pattern)) {
      return false;
    }
  }

  return true;
};

export const validateFileSize = (file: fileUpload.UploadedFile): boolean => {
  return file.size <= MAX_FILE_SIZE;
};

export const getUploadedFiles = (req: Request): fileUpload.FileArray => {
  return req.files as fileUpload.FileArray;
};

// Fungsi untuk menyimpan file multer ke direktori tertentu dan mengembalikan path relatif
export const saveMulterFile = async (file: Express.Multer.File, destination: string): Promise<string> => {
  const uploadDir = path.join(process.cwd(), 'src', 'uploads', destination);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // file path disimpan, return path relatif dari src
  const relativePath = path.relative(path.join(process.cwd(), 'src'), file.path);
  return `/${relativePath.replace(/\\/g, '/')}`;
};
