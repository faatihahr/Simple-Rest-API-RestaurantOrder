import fileUpload from 'express-fileupload';
import type { Request } from 'express';
export declare const saveUploadedFile: (file: fileUpload.UploadedFile, destination: string) => Promise<string>;
export declare const validateImageFile: (file: fileUpload.UploadedFile) => boolean;
export declare const validateFileSize: (file: fileUpload.UploadedFile) => boolean;
export declare const getUploadedFiles: (req: Request) => fileUpload.FileArray;
//# sourceMappingURL=upload.d.ts.map