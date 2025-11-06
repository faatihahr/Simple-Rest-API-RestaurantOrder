import prisma from '../lib/prisma.js';
// Custom validation function
const validateStockUpdate = (updates) => {
    for (const update of updates) {
        if (update.quantityChange < 0) {
            throw new Error(`Invalid quantity change for stock ${update.stockId}: cannot be negative`);
        }
    }
};
// Function to check and update product availability
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
        // Validate updates
        validateStockUpdate(updates.map(u => ({ stockId: u.stockId, quantityChange: u.quantityChange })));
        // Use transaction for batch updates
        await prisma.$transaction(async (tx) => {
            for (const update of updates) {
                // Check if stock exists and belongs to supplier
                const stock = await tx.stock.findUnique({
                    where: { id: update.stockId },
                    include: { supplier: true }
                });
                if (!stock) {
                    throw new Error(`Stock with id ${update.stockId} not found`);
                }
                if (stock.supplierId !== update.supplierId) {
                    throw new Error(`Stock ${update.stockId} does not belong to supplier ${update.supplierId}`);
                }
                // Calculate new quantity
                const newQuantity = stock.quantity + update.quantityChange;
                if (newQuantity < 0) {
                    throw new Error(`Insufficient stock for ${stock.name}: current ${stock.quantity}, change ${update.quantityChange}`);
                }
                // Update stock
                await tx.stock.update({
                    where: { id: update.stockId },
                    data: { quantity: newQuantity }
                });
            }
        });
        // Update product availability after transaction
        await updateProductAvailability();
        res.json({ message: 'Stocks updated successfully' });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=supplierController.js.map