import type { Request, Response, NextFunction } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

// Validasi untuk pembaruan stok
const validateStockUpdate = (updates: { stockId: number; quantityChange: number }[]) => {
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

export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  const { updates }: { updates: { stockId: number; quantityChange: number }[] } = req.body;

  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({ message: 'Updates array is required' });
  }

  try {
    // Validasi untuk pembaruan stok
    validateStockUpdate(updates);

    const updatedStocks: { stockId: number; beforeQuantity: number; afterQuantity: number; quantityChange: number }[] = [];

    // Transaksi untuk pembaruan stok massal
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
    const availableProducts: { id: number; name: string; description: string | null; price: number; stockName: string }[] = [];
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
    const uniqueProducts = availableProducts.filter((product, index, self) =>
      index === self.findIndex(p => p.id === product.id)
    );

    res.json({ message: 'Stocks updated successfully', data: updatedStocks, availableProducts: uniqueProducts });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
  const { name, stocks } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Supplier name is required' });
  }

  try {
    const supplier = await prisma.supplier.create({
      data: {
        name,
        stocks: stocks ? {
          create: stocks.map((stock: any) => ({
            name: stock.name,
            quantity: stock.quantity || 0,
            unit: stock.unit,
          })),
        } : undefined,
      },
      include: { stocks: true },
    });

    res.status(201).json({ message: 'Supplier created successfully', data: supplier });
  } catch (error) {
    next(error);
  }
};

export const createStock = async (req: Request, res: Response, next: NextFunction) => {
  const { name, quantity, unit, supplierId } = req.body;

  if (!name || !unit || !supplierId) {
    return res.status(400).json({ message: 'Name, unit, and supplierId are required' });
  }

  try {
    const stock = await prisma.stock.create({
      data: {
        name,
        quantity: quantity || 0,
        unit,
        supplierId,
      },
      include: { supplier: true },
    });

    res.status(201).json({ message: 'Stock created successfully', data: stock });
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { stocks: true },
    });

    res.json({ message: 'Suppliers fetched successfully', data: suppliers });
  } catch (error) {
    next(error);
  }
};

export const getStocks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stocks = await prisma.stock.findMany({
      include: { supplier: true },
    });

    res.json({ message: 'Stocks fetched successfully', data: stocks });
  } catch (error) {
    next(error);
  }
};

export const deleteStock = async (req: Request, res: Response, next: NextFunction) => {
  const { stockUpdates }: { stockUpdates: { stockId: number; quantityToDelete: number }[] } = req.body;

  if (!stockUpdates || !Array.isArray(stockUpdates)) {
    return res.status(400).json({ message: 'stockUpdates array is required' });
  }

  try {
    const updatedStocks: { stockId: number; beforeQuantity: number; afterQuantity: number; quantityDeleted: number }[] = [];

    // Transaksi untuk pengurangan kuantitas massal
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
  } catch (error) {
    next(error);
  }
};


