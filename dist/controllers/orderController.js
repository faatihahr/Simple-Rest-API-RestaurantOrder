import { orders } from '../models/Order.js';
import { products } from '../models/Product.js';
export const getOrders = (req, res) => {
    res.json(orders);
};
export const getOrderById = (req, res) => {
    const id = parseInt(req.params.id);
    const order = orders.find(o => o.id === id);
    if (order) {
        res.json(order);
    }
    else {
        res.status(404).json({ message: 'Order not found' });
    }
};
export const createOrder = (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Items are required' });
    }
    let total = 0;
    for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
            return res.status(400).json({ message: `Product with id ${item.productId} not found` });
        }
        total += product.price * item.quantity;
    }
    const newOrder = {
        id: orders.length + 1,
        items,
        total,
    };
    orders.push(newOrder);
    res.status(201).json(newOrder);
};
export const updateOrder = (req, res) => {
    const id = parseInt(req.params.id);
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex !== -1) {
        const { items } = req.body;
        if (items && Array.isArray(items) && items.length > 0) {
            let total = 0;
            for (const item of items) {
                const product = products.find(p => p.id === item.productId);
                if (!product) {
                    return res.status(400).json({ message: `Product with id ${item.productId} not found` });
                }
                total += product.price * item.quantity;
            }
            orders[orderIndex].total = total;
            orders[orderIndex].items = items;
        }
        res.json(orders[orderIndex]);
    }
    else {
        res.status(404).json({ message: 'Order not found' });
    }
};
export const deleteOrder = (req, res) => {
    const id = parseInt(req.params.id);
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex !== -1) {
        const deletedOrder = orders.splice(orderIndex, 1);
        res.json(deletedOrder);
    }
    else {
        res.status(404).json({ message: 'Order not found' });
    }
};
//# sourceMappingURL=orderController.js.map