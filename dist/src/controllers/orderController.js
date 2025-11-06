import prisma from '../lib/prisma.js';
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
    const { items, tableId, userId } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Items are required' });
    }
    try {
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
        const newOrder = await prisma.orders.create({
            data: {
                totalPrice,
                tableId,
                userId,
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
                },
                table: true,
                user: true
            }
        });
        res.status(201).json({ message: 'Order created successfully', data: newOrder });
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
            // menghitung ulang totalPrice dan menambahkan item baru
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
        // menampilkan seluruh item berdasarkan tanggal (createdAt)
        const orders = await prisma.orders.findMany({
            select: {
                createdAt: true,
                totalPrice: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 1000, //limitasi besar untuk mengambil data
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