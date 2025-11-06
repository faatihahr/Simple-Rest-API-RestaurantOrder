import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { PrismaClient } from '@prisma/client';

type OrderItemData = {
  productId: number;
  quantity: number;
  price: number;
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { sort, limit, offset } = req.query;

    const orderBy: any = {};
    if (sort) {
      const [field, direction] = (sort as string).split(':');
      if (field) {
        orderBy[field] = direction === 'desc' ? 'desc' : 'asc';
      }
    }

    const take = limit ? parseInt(limit as string) : undefined;
    const skip = offset ? parseInt(offset as string) : undefined;

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
      res.json({ message: 'Order fetched successfully', data: order });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  const { items, tableId, userId }: { items: { productId: number; quantity: number }[]; tableId?: number; userId?: number } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items are required' });
  }

  try {
    let totalPrice = 0;
    const orderItems: OrderItemData[] = [];
    const stockUpdates: { stockId: number; reduceBy: number }[] = [];

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
    const newOrder = await prisma.$transaction(async (tx: PrismaClient) => {
      const orderData: any = {
        totalPrice,
        items: {
          create: orderItems
        }
      };
      if (tableId !== undefined) orderData.tableId = tableId;
      if (userId !== undefined) orderData.userId = userId;

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

      return order;
    });

    res.status(201).json({ message: 'Order created successfully', data: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  const { items }: { items?: { productId: number; quantity: number }[] } = req.body;
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
    res.json({ message: 'Order deleted successfully', data: deletedOrder });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ message: 'Order not found' });
    } else {
      res.status(500).json({ message: 'Error deleting order', error });
    }
  }
};

export const getOrderSummary = async (req: Request, res: Response) => {
  try {
    const { limit, offset } = req.query;

    const take = limit ? parseInt(limit as string) : 10;
    const skip = offset ? parseInt(offset as string) : 0;

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
    const summaryMap = new Map<string, { orderCount: number; totalRevenue: number }>();

    orders.forEach((order: any) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (summaryMap.has(date)) {
        const existing = summaryMap.get(date)!;
        existing.orderCount += 1;
        existing.totalRevenue += order.totalPrice;
      } else {
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
  } catch (error) {
    console.error('Error in getOrderSummary:', error);
    res.status(500).json({ message: 'Error fetching order summary', error: (error as any).message });
  }
};
