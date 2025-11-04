import type { Request, Response } from 'express';
import { prisma } from '../connection/client.js';

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.orders.findMany({
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
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
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
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  const { items }: { items: { productId: number; quantity: number }[] } = req.body;
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
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  const { items }: { items?: { productId: number; quantity: number }[] } = req.body;
  try {
    if (items && Array.isArray(items) && items.length > 0) {
      // Delete existing items
      await prisma.orderItems.deleteMany({
        where: { orderId: id }
      });
      // Recalculate total price and create new items
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
      res.json(updatedOrder);
    } else {
      res.status(400).json({ message: 'Items are required' });
    }
  } catch (error) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ message: 'Order not found' });
    } else {
      res.status(500).json({ message: 'Error updating order', error });
    }
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
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
    res.json(deletedOrder);
  } catch (error) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ message: 'Order not found' });
    } else {
      res.status(500).json({ message: 'Error deleting order', error });
    }
  }
};
