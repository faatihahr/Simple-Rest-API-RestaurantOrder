import type { Request, Response } from 'express';
import { orders } from '../models/Order.js';
import { products } from '../models/Product.js';
import type { Order, OrderItem } from '../models/Order.js';

export const getOrders = (req: Request, res: Response) => {
  res.json(orders);
};

export const getOrderById = (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  const order = orders.find(o => o.id === id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export const createOrder = (req: Request, res: Response) => {
  const { items }: { items: OrderItem[] } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items are required' });
  }

  let total = 0;
  const itemsWithNames: OrderItem[] = [];
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ message: `Product with id ${item.productId} not found` });
    }
    total += product.price * item.quantity;
    itemsWithNames.push({
      productId: item.productId,
      quantity: item.quantity,
      name: product.name,
    });
  }

  const newOrder: Order = {
    id: orders.length + 1,
    items: itemsWithNames,
    total,
  };
  orders.push(newOrder);
  res.status(201).json(newOrder);
};

export const updateOrder = (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  const orderIndex = orders.findIndex(o => o.id === id);
  if (orderIndex !== -1) {
    const { items }: { items?: OrderItem[] } = req.body;
    if (items && Array.isArray(items) && items.length > 0) {
      let total = 0;
      const itemsWithNames: OrderItem[] = [];
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product with id ${item.productId} not found` });
        }
        total += product.price * item.quantity;
        itemsWithNames.push({
          productId: item.productId,
          quantity: item.quantity,
          name: product.name,
        });
      }
      orders[orderIndex]!.total = total;
      orders[orderIndex]!.items = itemsWithNames;
    }
    res.json(orders[orderIndex]);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export const deleteOrder = (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  const orderIndex = orders.findIndex(o => o.id === id);
  if (orderIndex !== -1) {
    const deletedOrder = orders.splice(orderIndex, 1);
    res.json(deletedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};
