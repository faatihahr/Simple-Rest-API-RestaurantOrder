import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { registerSchema, loginSchema } from '../lib/validation.js';
import { saveUploadedFile, validateImageFile, getUploadedFiles, saveMulterFile } from '../lib/upload.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
    });

    // Clear cookie
    res.clearCookie('token');

    res.status(200).json({
      message: 'Logout successful'
    });
  } catch (error: any) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validasi input pake Joi
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new Error(error.details?.[0]?.message || 'Validation error');
    }

    const { email, password } = value;

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        point: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('Email not registered');
    }

    // Bandingin password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store token in session
    req.session.token = token;

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Hapus password dari response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== REGISTER REQUEST DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Raw headers:', req.rawHeaders);
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    // Check if this is a multipart request
    const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
    console.log('Is multipart:', isMultipart);

    // Validasi input pake Joi - handle both JSON and form data
    let validationData = req.body;
    if (isMultipart) {
      // For multipart form data, fields are in req.body
      validationData = req.body;
      console.log('Using multipart validation data:', validationData);
    }

    const { error, value } = registerSchema.validate(validationData);
    if (error) {
      console.log('Validation error:', error.details);
      throw new Error(error.details?.[0]?.message || 'Validation error');
    }

    const { name, email, password, role } = value;
    console.log('Validated data:', { name, email, role });

    // Cek apakah user udah ada
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle profile image upload (only one image allowed)
    let profileImageUrl: string | undefined;

    // Check for multer files first (new implementation)
    if ((req as any).file) {
      const file = (req as any).file;
      console.log('Using multer file:', file);

      // Basic validation
      if (file.size === 0) {
        throw new Error('Profile image file is empty.');
      }

      // Check filename for path traversal attempts
      if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
        throw new Error('Invalid filename.');
      }

      profileImageUrl = await saveMulterFile(file, 'profiles');
      console.log('Saved multer file with URL:', profileImageUrl);
    } else {
      // Fallback to express-fileupload
      const files = getUploadedFiles(req);
      if (files && files.profileImage) {
        const profileImages = Array.isArray(files.profileImage) ? files.profileImage : [files.profileImage];

        // Limit to one profile image
        if (profileImages.length > 1) {
          throw new Error('Only one profile image is allowed.');
        }

        const profileImage = profileImages[0];
        if (profileImage) {
          // Additional validation: Check for empty files
          if (profileImage.size === 0) {
            throw new Error('Profile image file is empty.');
          }

          // Validate image file with enhanced security checks
          if (!validateImageFile(profileImage)) {
            throw new Error('Invalid profile image file. Only JPEG, PNG, GIF, and WebP files up to 10MB are allowed.');
          }

          // Check filename for path traversal attempts
          if (profileImage.name.includes('..') || profileImage.name.includes('/') || profileImage.name.includes('\\')) {
            throw new Error('Invalid filename.');
          }

          profileImageUrl = await saveUploadedFile(profileImage, 'profiles');
        }
      }
    }

    // Buat user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'user', // Default ke 'user' kalau ga ditentuin
        profileImage: profileImageUrl
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        point: true,
        profileImage: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error: any) {
    next(error);
  }
};

export const supplierLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validasi input pake Joi
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new Error(error.details?.[0]?.message || 'Validation error');
    }

    const { email, password } = value;

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        point: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('Email not registered');
    }

    // Cek apakah user supplier
    if (user.role !== 'supplier') {
      throw new Error('Access denied: Only suppliers can login here');
    }

    // Bandingin password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store token in session
    req.session.token = token;

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Hapus password dari response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Supplier login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    next(error);
  }
};
