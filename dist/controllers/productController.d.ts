import type { Request, Response } from 'express';
export declare const getProducts: (req: Request, res: Response) => void;
export declare const getProductById: (req: Request, res: Response) => void;
export declare const createProduct: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const updateProduct: (req: Request, res: Response) => void;
export declare const deleteProduct: (req: Request, res: Response) => void;
//# sourceMappingURL=productController.d.ts.map