import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true }
        });
        if (!user) {
            return next();
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
export const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new Error('Authentication required');
        }
        if (!roles.includes(req.user.role)) {
            throw new Error('Access denied');
        }
        next();
    };
};
//# sourceMappingURL=auth-middleware.js.map