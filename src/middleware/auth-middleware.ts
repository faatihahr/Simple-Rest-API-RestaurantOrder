import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production

// Extend Request interface buat include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: 'admin' | 'user' | 'supplier';
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: 'admin' | 'user' | 'supplier' };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return next();
    }

    req.user = user;
    next();
  } catch (error: any) {
    next(error);
  }
};

export const authorize = (roles: ('admin' | 'user' | 'supplier')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new Error('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new Error('Access denied');
    }

    next();
  };
};
