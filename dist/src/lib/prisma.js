import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const globalForPrisma = global;
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: ['query'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
export default prisma;
//# sourceMappingURL=prisma.js.map