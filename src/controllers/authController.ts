import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { registerSchema, loginSchema } from '../lib/validation.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production

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
    // Validasi input pake Joi
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new Error(error.details?.[0]?.message || 'Validation error');
    }

    const { name, email, password, role } = value;

    // Cek apakah user udah ada
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'user' // Default ke 'user' kalau ga ditentuin
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        point: true,
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
