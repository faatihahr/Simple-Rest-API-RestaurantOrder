import prisma from '../lib/prisma.js';
export const transferPoints = async (req, res) => {
    const { senderId, receiverId, points } = req.body;
    if (!senderId || !receiverId || !points) {
        return res.status(400).json({ message: 'senderId, receiverId, and points are required' });
    }
    if (points <= 0) {
        return res.status(400).json({ message: 'Points must be greater than 0' });
    }
    if (senderId === receiverId) {
        return res.status(400).json({ message: 'Sender and receiver cannot be the same' });
    }
    try {
        // Fetch sender and receiver points before transaction
        const senderBefore = await prisma.user.findUnique({
            where: { id: senderId },
            select: { point: true }
        });
        if (!senderBefore) {
            return res.status(400).json({ message: 'Sender not found' });
        }
        const receiverBefore = await prisma.user.findUnique({
            where: { id: receiverId },
            select: { point: true }
        });
        if (!receiverBefore) {
            return res.status(400).json({ message: 'Receiver not found' });
        }
        if (senderBefore.point < points) {
            return res.status(400).json({ message: 'Not enough points!' });
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
        // Fetch points after transaction
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
        res.status(500).json({ message: 'Error transferring points', error: error.message });
    }
};
export const getUsers = async (req, res) => {
    const { email, limit } = req.query;
    try {
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
                point: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json({ users });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};
export const createUser = async (req, res) => {
    const body = req.body;
    const { name, email, password } = body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'name, email, and password are required' });
    }
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, point } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    const userId = parseInt(id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: email }
            });
            if (emailExists && emailExists.id !== userId) {
                return res.status(400).json({ message: 'Email already exists' });
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    const userId = parseInt(id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        await prisma.user.delete({
            where: { id: userId }
        });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};
//# sourceMappingURL=userController.js.map