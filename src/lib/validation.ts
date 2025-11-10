import Joi from 'joi';

// Schema buat registrasi user
export const registerSchema = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/).required(),
  role: Joi.string().valid('admin', 'user').optional()
});

// Schema buat login user
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Schema buat bikin stock
export const createStockSchema = Joi.object({
  name: Joi.string().min(1).required(),
  quantity: Joi.number().min(0).optional(),
  unit: Joi.string().min(1).required()
});

// Schema buat registrasi supplier
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

// Schema buat transfer poin
export const transferPointsSchema = Joi.object({
  senderId: Joi.number().integer().positive().required(),
  receiverId: Joi.number().integer().positive().required(),
  points: Joi.number().integer().min(1).required()
});

// Schema buat update stok
export const updateStockSchema = Joi.object({
  updates: Joi.array().items(Joi.object({
    stockId: Joi.number().integer().positive().required(),
    quantityChange: Joi.number().integer().min(0).required()
  })).required()
});

// Schema buat hapus stok
export const deleteStockSchema = Joi.object({
  stockUpdates: Joi.array().items(Joi.object({
    stockId: Joi.number().integer().positive().required(),
    quantityToDelete: Joi.number().integer().min(1).required()
  })).required()
});
