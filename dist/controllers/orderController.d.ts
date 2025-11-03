import type { Request, Response } from 'express';
export declare const getOrders: (req: Request, res: Response) => void;
export declare const getOrderById: (req: Request, res: Response) => void;
export declare const createOrder: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const updateOrder: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const deleteOrder: (req: Request, res: Response) => void;
//# sourceMappingURL=orderController.d.ts.map