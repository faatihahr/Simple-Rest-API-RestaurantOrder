import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
// Maximum file size per image (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Magic bytes for image file validation (more comprehensive)
const IMAGE_SIGNATURES = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
    'image/jpg': [0xFF, 0xD8, 0xFF] // JPG is same as JPEG
};
// Maximum image dimensions (to prevent memory exhaustion)
const MAX_WIDTH = 4096;
const MAX_HEIGHT = 4096;
export const saveUploadedFile = async (file, destination) => {
    const uploadDir = path.join(process.cwd(), 'uploads', destination);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    await file.mv(filePath);
    return `/uploads/${destination}/${fileName}`;
};
export const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
        return false;
    }
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return false;
    }
    // Validate file content using magic bytes
    const buffer = file.data;
    const signature = IMAGE_SIGNATURES[file.mimetype];
    if (!signature) {
        return false;
    }
    // Check if file starts with correct magic bytes
    for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
            return false;
        }
    }
    // Additional security: Check for embedded scripts or malicious content
    // Look for suspicious patterns in the first 1KB
    const firstKB = buffer.slice(0, 1024).toString('ascii', 0, 1024).toLowerCase();
    const suspiciousPatterns = ['<script', 'javascript:', 'vbscript:', 'onload=', 'onerror='];
    for (const pattern of suspiciousPatterns) {
        if (firstKB.includes(pattern)) {
            return false;
        }
    }
    return true;
};
export const validateFileSize = (file) => {
    return file.size <= MAX_FILE_SIZE;
};
export const getUploadedFiles = (req) => {
    return req.files;
};
//# sourceMappingURL=upload.js.map