import prisma from '../lib/prisma.js';
export const transferPoints = async (req, res, next) => {
    try {
        const { senderId, receiverId, points } = req.body;
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
        await prisma.$transaction(async (tx) => {
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
                after: senderAfter.point
            },
            receiver: {
                user: receiverId,
                receiveAmount: points,
                before: receiverBefore.point,
                after: receiverAfter.point
            }
        });
    }
    catch (error) {
        next(error);
    }
};
export const getUsers = async (req, res, next) => {
    try {
        const { email, limit } = req.query;
        const where = {};
        if (email) {
            where.email = {
                contains: email,
                mode: 'insensitive'
            };
        }
        const take = limit ? parseInt(limit) : undefined;
        const users = await prisma.user.findMany({
            where,
            take,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                point: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json({ users });
    }
    catch (error) {
        next(error);
    }
};
export const createUser = async (req, res, next) => {
    try {
        const body = req.body;
        const { name, email, password, role } = body;
        if (!name || !email || !password) {
            throw new Error('name, email, and password are required');
        }
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
        // Password validation: min 8 chars, at least 1 uppercase, 1 symbol
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            throw new Error('Password must be at least 8 characters long, contain at least one uppercase letter, and one symbol');
        }
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });
        if (existingUser) {
            throw new Error('Email already exists');
        }
        // Hash password
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'user'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                point: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.status(201).json({ user });
    }
    catch (error) {
        next(error);
    }
};
export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, password, point } = req.body;
        if (!id) {
            throw new Error('User ID is required');
        }
        const userId = parseInt(id);
        if (isNaN(userId)) {
            throw new Error('Invalid user ID');
        }
        // Check if user is authenticated and owns the data
        if (!req.user) {
            throw new Error('Authentication required');
        }
        if (req.user.id !== userId) {
            throw new Error('You can only update your own data');
        }
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        if (email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: email }
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
                role: true,
                point: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
};
export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new Error('User ID is required');
        }
        const userId = parseInt(id);
        if (isNaN(userId)) {
            throw new Error('Invalid user ID');
        }
        // Check if user is authenticated and owns the data
        if (!req.user) {
            throw new Error('Authentication required');
        }
        if (req.user.id !== userId) {
            throw new Error('You can only delete your own data');
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
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=userController.js.map