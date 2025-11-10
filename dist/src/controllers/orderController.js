import prisma from '../lib/prisma.js';
import { PrismaClient } from '@prisma/client';
export const getOrders = async (req, res) => {
    try {
        const { sort, limit, offset } = req.query;
        const orderBy = {};
        if (sort) {
            const [field, direction] = sort.split(':');
            if (field) {
                orderBy[field] = direction === 'desc' ? 'desc' : 'asc';
            }
        }
        const take = limit ? parseInt(limit) : undefined;
        const skip = offset ? parseInt(offset) : undefined;
        const orders = await prisma.orders.findMany({
            orderBy,
            take,
            skip,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true
                            }
                        }
                    }
                },
                user: true,
                table: true
            }
        });
        res.json({ message: 'Orders list fetched successfully', data: orders });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};
export const getOrderById = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const order = await prisma.orders.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true
                            }
                        }
                    }
                }
            }
        });
        if (order) {
            res.json({ message: 'Order fetched successfully', data: order });
        }
        else {
            res.status(404).json({ message: 'Order not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching order', error });
    }
};
export const createOrder = async (req, res) => {
    const { items, tableId, userId: manualUserId } = req.body;
    const tokenUserId = req.user?.id; // Ambil userId dari token JWT jika login
    // Jika user login, gunakan userId dari token, jangan izinkan manual input userId
    if (tokenUserId && manualUserId && tokenUserId !== manualUserId) {
        return res.status(400).json({ message: 'Cannot specify userId manually when logged in. UserId will be taken from JWT token.' });
    }
    const userId = tokenUserId || manualUserId; // Prioritas dari token, jika tidak ada token maka dari body (untuk backward compatibility)
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Items are required' });
    }
    try {
        let totalPrice = 0;
        const orderItems = [];
        const stockUpdates = [];
        for (const item of items) {
            const product = await prisma.products.findUnique({
                where: { id: item.productId },
                include: { stocks: { include: { stock: true } } }
            });
            if (!product) {
                return res.status(400).json({ message: `Product with id ${item.productId} not found` });
            }
            // Mengecek dan mengurangi stok yang tersedia
            for (const prodStock of product.stocks) {
                const required = prodStock.quantityRequired * item.quantity;
                if (prodStock.stock.quantity < required) {
                    return res.status(400).json({ message: `Insufficient stock for ${prodStock.stock.name}` });
                }
                stockUpdates.push({ stockId: prodStock.stockId, reduceBy: required });
            }
            const price = product.price * item.quantity;
            totalPrice += price;
            orderItems.push({
                productId: item.productId,
                quantity: item.quantity,
                price
            });
        }
        // Transaksi untuk membuat order dan memperbarui stok
        const newOrder = await prisma.$transaction(async (tx) => {
            const orderData = {
                totalPrice,
                items: {
                    create: orderItems
                }
            };
            if (tableId !== undefined)
                orderData.tableId = tableId;
            if (userId !== undefined)
                orderData.userId = userId;
            const order = await tx.orders.create({
                data: orderData,
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true
                                }
                            }
                        }
                    },
                    table: true,
                    user: true
                }
            });
            // Update jumlah stok
            for (const update of stockUpdates) {
                await tx.stock.update({
                    where: { id: update.stockId },
                    data: { quantity: { decrement: update.reduceBy } }
                });
            }
            // Berikan poin ke pengguna biasa
            let pointsAdded = 0;
            if (userId !== undefined) {
                const user = await tx.user.findUnique({
                    where: { id: userId },
                    select: { role: true }
                });
                if (user && user.role === 'user') {
                    pointsAdded = Math.floor(totalPrice / 2);
                    await tx.user.update({
                        where: { id: userId },
                        data: { point: { increment: pointsAdded } }
                    });
                }
            }
            return { order, pointsAdded };
        });
        const responseMessage = userId
            ? `Order created successfully. Points added: ${newOrder.pointsAdded}`
            : 'Order created successfully. No points added (not logged in)';
        res.status(201).json({
            message: responseMessage,
            data: {
                ...newOrder.order,
                pointsAdded: newOrder.pointsAdded
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating order', error });
    }
};
export const updateOrder = async (req, res) => {
    const id = parseInt(req.params.id);
    const { items } = req.body;
    try {
        if (items && Array.isArray(items) && items.length > 0) {
            // Hapus item
            await prisma.orderItems.deleteMany({
                where: { orderId: id }
            });
            // Hitung ulang totalPrice dan tambahkan item baru
            let totalPrice = 0;
            const orderItems = [];
            for (const item of items) {
                const product = await prisma.products.findUnique({ where: { id: item.productId } });
                if (!product) {
                    return res.status(400).json({ message: `Product with id ${item.productId} not found` });
                }
                const price = product.price * item.quantity;
                totalPrice += price;
                orderItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price
                });
            }
            const updatedOrder = await prisma.orders.update({
                where: { id },
                data: {
                    totalPrice,
                    items: {
                        create: orderItems
                    }
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true
                                }
                            }
                        }
                    }
                }
            });
            res.json({ message: 'Order updated successfully', data: updatedOrder });
        }
        else {
            res.status(400).json({ message: 'Items are required' });
        }
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'Order not found' });
        }
        else {
            res.status(500).json({ message: 'Error updating order', error });
        }
    }
};
export const deleteOrder = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const deletedOrder = await prisma.orders.delete({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true
                            }
                        }
                    }
                }
            }
        });
        res.json({ message: 'Order deleted successfully', data: deletedOrder });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'Order not found' });
        }
        else {
            res.status(500).json({ message: 'Error deleting order', error });
        }
    }
};
export const getOrderSummary = async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const take = limit ? parseInt(limit) : 10;
        const skip = offset ? parseInt(offset) : 0;
        // Tampilkan seluruh item berdasarkan tanggal (createdAt)
        const orders = await prisma.orders.findMany({
            select: {
                createdAt: true,
                totalPrice: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 1000, // Limitasi besar untuk mengambil data
            skip: 0
        });
        // Group orders berdasarkan tanggal
        const summaryMap = new Map();
        orders.forEach((order) => {
            const date = order.createdAt.toISOString().split('T')[0];
            if (summaryMap.has(date)) {
                const existing = summaryMap.get(date);
                existing.orderCount += 1;
                existing.totalRevenue += order.totalPrice;
            }
            else {
                summaryMap.set(date, {
                    orderCount: 1,
                    totalRevenue: order.totalPrice
                });
            }
        });
        const formattedSummary = Array.from(summaryMap.entries())
            .map(([date, data]) => ({
            date,
            orderCount: data.orderCount,
            totalRevenue: data.totalRevenue
        }))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(skip, skip + take);
        res.json({ message: 'Order summary fetched successfully', data: formattedSummary });
    }
    catch (error) {
        console.error('Error in getOrderSummary:', error);
        res.status(500).json({ message: 'Error fetching order summary', error: error.message });
    }
};
//# sourceMappingURL=orderController.js.map