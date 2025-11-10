import type { Request, Response, NextFunction } from 'express';
export declare const updateStock: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const registerSupplier: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createStock: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSuppliers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getStocks: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteStock: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=supplierController.d.ts.map