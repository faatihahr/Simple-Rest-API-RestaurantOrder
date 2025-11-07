import Joi from 'joi';
// Schema for user registration
export const registerSchema = Joi.object({
    name: Joi.string().min(1).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/).required(),
    role: Joi.string().valid('admin', 'user').optional()
});
// Schema for user login
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});
// Schema for creating stock
export const createStockSchema = Joi.object({
    name: Joi.string().min(1).required(),
    quantity: Joi.number().min(0).optional(),
    unit: Joi.string().min(1).required()
});
// Schema for supplier registration (optional, for consistency)
export const registerSupplierSchema = Joi.object({
    name: Joi.string().min(1).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/).required(),
    stocks: Joi.array().items(Joi.object({
        name: Joi.string().min(1).required(),
        quantity: Joi.number().min(0).optional(),
        unit: Joi.string().min(1).required()
    })).optional()
});
//# sourceMappingURL=validation.js.map