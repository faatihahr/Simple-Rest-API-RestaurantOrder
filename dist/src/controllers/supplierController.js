import prisma from '../lib/prisma.js';
import { createStockSchema, registerSupplierSchema } from '../lib/validation.js';
// Validasi untuk pembaruan stok
const validateStockUpdate = (updates) => {
    for (const update of updates) {
        if (update.quantityChange < 0) {
            throw new Error(`Invalid quantity change for stock ${update.stockId}: cannot be negative`);
        }
    }
};
// Perbarui ketersediaan produk berdasarkan stok
const updateProductAvailability = async () => {
    const products = await prisma.products.findMany({
        include: {
            stocks: {
                include: {
                    stock: true
                }
            }
        }
    });
    for (const product of products) {
        let available = true;
        for (const productStock of product.stocks) {
            if (productStock.stock.quantity < productStock.quantityRequired) {
                available = false;
                break;
            }
        }
        await prisma.products.update({
            where: { id: product.id },
            data: { isAvailable: available }
        });
    }
};
export const updateStock = async (req, res, next) => {
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: 'Updates array is required' });
    }
    try {
        // Validasi untuk pembaruan stok
        validateStockUpdate(updates);
        const updatedStocks = [];
        // Transaksi untuk pembaruan stok massal
        await prisma.$transaction(async (tx) => {
            for (const update of updates) {
                // Cek apakah stok ada
                const stock = await tx.stock.findUnique({
                    where: { id: update.stockId }
                });
                if (!stock) {
                    throw new Error(`Stock with id ${update.stockId} not found`);
                }
                // Hitung kuantitas baru
                const beforeQuantity = stock.quantity;
                const newQuantity = stock.quantity + update.quantityChange;
                if (newQuantity < 0) {
                    throw new Error(`Insufficient stock for ${stock.name}: current ${stock.quantity}, change ${update.quantityChange}`);
                }
                // Update stock
                await tx.stock.update({
                    where: { id: update.stockId },
                    data: { quantity: newQuantity }
                });
                updatedStocks.push({
                    stockId: update.stockId,
                    beforeQuantity,
                    afterQuantity: newQuantity,
                    quantityChange: update.quantityChange
                });
            }
        });
        // Update produk yang tersedia berdasarkan stok yang diperbarui
        await updateProductAvailability();
        // Menampilkan produk yang dapat dibuat dari stok yang diperbarui
        const availableProducts = [];
        for (const updated of updatedStocks) {
            const stock = await prisma.stock.findUnique({
                where: { id: updated.stockId },
                include: { products: { include: { product: true } } }
            });
            if (stock) {
                for (const productStock of stock.products) {
                    if (stock.quantity >= productStock.quantityRequired) {
                        availableProducts.push({
                            id: productStock.product.id,
                            name: productStock.product.name,
                            description: productStock.product.description,
                            price: productStock.product.price,
                            stockName: stock.name
                        });
                    }
                }
            }
        }
        // Hapus duplikat produk jika ada
        const uniqueProducts = availableProducts.filter((product, index, self) => index === self.findIndex(p => p.id === product.id));
        res.json({ message: 'Stocks updated successfully', data: updatedStocks, availableProducts: uniqueProducts });
    }
    catch (error) {
        next(error);
    }
};
export const registerSupplier = async (req, res, next) => {
    try {
        // Validate input using Joi
        const { error, value } = registerSupplierSchema.validate(req.body);
        if (error) {
            throw new Error(error.details?.[0]?.message || 'Validation error');
        }
        const { name, email, password, stocks } = value;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new Error('Email already exists');
        }
        // Hash password
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.default.hash(password, 10);
        // Create user and supplier in transaction
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'supplier'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            });
            const supplierData = {
                userId: user.id,
                name,
            };
            if (stocks) {
                supplierData.stocks = {
                    create: stocks.map((stock) => ({
                        name: stock.name,
                        quantity: stock.quantity || 0,
                        unit: stock.unit,
                    })),
                };
            }
            const supplier = await tx.supplier.create({
                data: supplierData,
                include: { stocks: true },
            });
            return { user, supplier };
        });
        // Generate JWT token
        const jwt = await import('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const token = jwt.default.sign({ id: result.user.id, email: result.user.email, role: result.user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'Supplier registered successfully',
            user: result.user,
            supplier: result.supplier,
            token
        });
    }
    catch (error) {
        next(error);
    }
};
export const createStock = async (req, res, next) => {
    if (!req.user || req.user.role !== 'supplier') {
        return res.status(403).json({ message: 'Only logged-in suppliers can create stock' });
    }
    try {
        // Validate input using Joi
        const { error, value } = createStockSchema.validate(req.body);
        if (error) {
            throw new Error(error.details?.[0]?.message || 'Validation error');
        }
        const { name, quantity, unit } = value;
        // Find supplier by userId
        const supplier = await prisma.supplier.findUnique({
            where: { userId: req.user.id }
        });
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        const stock = await prisma.stock.create({
            data: {
                name,
                quantity: quantity || 0,
                unit,
                supplierId: supplier.id,
            },
            include: { supplier: true },
        });
        res.status(201).json({ message: 'Stock created successfully', data: stock });
    }
    catch (error) {
        next(error);
    }
};
export const getSuppliers = async (req, res, next) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            include: { stocks: true },
        });
        res.json({ message: 'Suppliers fetched successfully', data: suppliers });
    }
    catch (error) {
        next(error);
    }
};
export const getStocks = async (req, res, next) => {
    try {
        const stocks = await prisma.stock.findMany({
            include: { supplier: true },
        });
        res.json({ message: 'Stocks fetched successfully', data: stocks });
    }
    catch (error) {
        next(error);
    }
};
export const deleteStock = async (req, res, next) => {
    const { stockUpdates } = req.body;
    if (!stockUpdates || !Array.isArray(stockUpdates)) {
        return res.status(400).json({ message: 'stockUpdates array is required' });
    }
    try {
        const updatedStocks = [];
        // Transaksi untuk pengurangan kuantitas massal
        await prisma.$transaction(async (tx) => {
            for (const update of stockUpdates) {
                // Cek apakah stok ada
                const stock = await tx.stock.findUnique({
                    where: { id: update.stockId }
                });
                if (!stock) {
                    throw new Error(`Stock with id ${update.stockId} not found`);
                }
                // hitung kuantitas baru
                const beforeQuantity = stock.quantity;
                const newQuantity = Math.max(0, stock.quantity - update.quantityToDelete); // Prevent negative quantity
                // Update stock quantity
                await tx.stock.update({
                    where: { id: update.stockId },
                    data: { quantity: newQuantity }
                });
                updatedStocks.push({
                    stockId: update.stockId,
                    beforeQuantity,
                    afterQuantity: newQuantity,
                    quantityDeleted: update.quantityToDelete
                });
            }
        });
        // Update produk yang tersedia berdasarkan stok yang diperbarui
        await updateProductAvailability();
        // Mnampilkan produk yang terpengaruh (tidak tersedia atau diarsipkan)
        const affectedProducts = await prisma.products.findMany({
            where: {
                OR: [
                    { isAvailable: false },
                    { isArchived: true }
                ]
            },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                isAvailable: true,
                isArchived: true
            }
        });
        res.json({
            message: 'Stock quantities reduced successfully',
            updatedStocks,
            affectedProducts
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=supplierController.js.map