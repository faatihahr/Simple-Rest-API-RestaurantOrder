import type { Request, Response, NextFunction } from 'express';
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
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (roles: ("admin" | "user" | "supplier")[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth-middleware.d.ts.map