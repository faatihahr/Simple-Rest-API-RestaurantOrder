import fileUpload from 'express-fileupload';
import path from 'path';
import os from 'os';
import fs from 'fs';
export const uploadMiddleware = fileUpload({
    limits: {
        fileSize: 10 * 1024 * 1024, // Align with validation limit: 10MB per file
        files: 10, // Maximum 10 files per request
        fields: 100, // Maximum 100 fields
        fieldSize: 1024 * 1024, // 1MB per field
    },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: path.join(os.tmpdir(), 'uploads'),
    createParentPath: true,
    safeFileNames: true,
    preserveExtension: true,
});
// Cleanup function for temp files
export const cleanupTempFiles = () => {
    const tempDir = path.join(os.tmpdir(), 'uploads');
    if (fs.existsSync(tempDir)) {
        fs.readdir(tempDir, (err, files) => {
            if (err)
                return;
            files.forEach(file => {
                const filePath = path.join(tempDir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err)
                        return;
                    // Remove files older than 1 hour
                    if (Date.now() - stats.mtime.getTime() > 60 * 60 * 1000) {
                        fs.unlink(filePath, () => { });
                    }
                });
            });
        });
    }
};
// Run cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);
//# sourceMappingURL=upload-middleware.js.map