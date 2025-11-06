import type { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

export const transferPoints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { senderId, receiverId, points }: { senderId: number; receiverId: number; points: number } = req.body;

    if (!senderId || !receiverId || !points) {
      throw new Error('senderId, receiverId, and points are required');
    }

    if (points <= 0) {
      throw new Error('Points must be greater than 0');
    }

    if (senderId === receiverId) {
      throw new Error('Sender and receiver cannot be the same');
    }
    // Memeriksa poin pengirim sebelum transaksi
    const senderBefore = await prisma.user.findUnique({
      where: { id: senderId },
      select: { point: true }
    });

    if (!senderBefore) {
      throw new Error('Sender not found');
    }

    const receiverBefore = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { point: true }
    });

    if (!receiverBefore) {
      throw new Error('Receiver not found');
    }

    if (senderBefore.point < points) {
      throw new Error('Not enough points!');
    }

    // Transaction process
    await prisma.$transaction(async (tx: any) => {
      // Deduct from sender
      await tx.user.update({
        where: { id: senderId },
        data: { point: { decrement: points } }
      });

      // Add to receiver
      await tx.user.update({
        where: { id: receiverId },
        data: { point: { increment: points } }
      });
    });

    // Memeriksa poin setelah transaksi
    const senderAfter = await prisma.user.findUnique({
      where: { id: senderId },
      select: { point: true }
    });

    const receiverAfter = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { point: true }
    });

    res.json({
      message: 'Points successfully transferred',
      sender: {
        user: senderId,
        transferAmount: points,
        before: senderBefore.point,
        after: senderAfter!.point
      },
      receiver: {
        user: receiverId,
        receiveAmount: points,
        before: receiverBefore.point,
        after: receiverAfter!.point
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, limit } = req.query;
    const where: any = {};
    if (email) {
      where.email = {
        contains: email as string,
        mode: 'insensitive'
      };
    }

    const take = limit ? parseInt(limit as string) : undefined;

    const users = await prisma.user.findMany({
      where,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        point: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ users });
  } catch (error: any) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as { name: string; email: string; password: string };
    const { name, email, password } = body;

    if (!name || !email || !password) {
      throw new Error('name, email, and password are required');
    }
    const existingUser = await prisma.user.findUnique({
      where: { email: email! }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password
      },
      select: {
        id: true,
        name: true,
        email: true,
        point: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({ user });
  } catch (error: any) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, email, password, point }: { name?: string; email?: string; password?: string; point?: number } = req.body;

    if (!id) {
      throw new Error('User ID is required');
    }

    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new Error('Invalid user ID');
    }
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    if (email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email as string }
      });
      if (emailExists && emailExists.id !== userId) {
        throw new Error('Email already exists');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(password && { password }),
        ...(point !== undefined && { point })
      },
      select: {
        id: true,
        name: true,
        email: true,
        point: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ user });
  } catch (error: any) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('User ID is required');
    }

    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new Error('Invalid user ID');
    }
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    next(error);
  }
};
