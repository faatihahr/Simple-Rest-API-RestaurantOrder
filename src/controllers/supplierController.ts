import type { Request, Response, NextFunction } from 'express';
import type { Prisma } from '@prisma/client';
import path from 'path';
import prisma from '../lib/prisma.js';
import { registerSupplierSchema, createStockSchema } from '../lib/validation.js';
import { validateImageFile } from '../lib/upload.js';

// Validasi buat update stok
const validateStockUpdate = (updates: { stockId: number; quantityChange: number }[]) => {
  for (const update of updates) {
    if (update.quantityChange < 0) {
      throw new Error(`Invalid quantity change for stock ${update.stockId}: cannot be negative`);
    }
  }
};

// Update ketersediaan produk berdasarkan stok
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

  try {

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

        // Update stok
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

export const registerSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validasi input pake Joi
    const { error, value } = registerSupplierSchema.validate(req.body);
    if (error) {
      throw new Error(error.details?.[0]?.message || 'Validation error');
    }

    const { name, email, password, stocks } = value;

    // Cek apakah user udah ada
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Handle upload gambar profil
    let profileImageUrl: string | undefined;
    const profileImages = req.files ? (req.files as any).profileImage : null;
    if (profileImages) {
      // Limit to one profile image
      if (Array.isArray(profileImages)) {
        if (profileImages.length > 1) {
          throw new Error('Only one profile image is allowed.');
        }
        const profileImage = profileImages[0];
        if (profileImage) {
          // Validasi tambahan: Cek file kosong
          if (profileImage.size === 0) {
            throw new Error('Profile image file is empty.');
          }

          // Validasi file gambar dengan cek keamanan yang lebih ketat
          if (!validateImageFile(profileImage)) {
            throw new Error('Invalid profile image file. Only JPEG, PNG, GIF, and WebP files up to 10MB are allowed.');
          }

          // Cek nama file buat hindari path traversal
          if (profileImage.originalname.includes('..') || profileImage.originalname.includes('/') || profileImage.originalname.includes('\\')) {
            throw new Error('Invalid filename.');
          }

          profileImageUrl = `/uploads/profiles/${profileImage.filename || profileImage.originalname}`;
        }
      } else {
        // Single file
        const profileImage = profileImages;
        if (profileImage) {
          // Validasi tambahan: Cek file kosong
          if (profileImage.size === 0) {
            throw new Error('Profile image file is empty.');
          }

          // Validasi file gambar 
          if (!validateImageFile(profileImage)) {
            throw new Error('Invalid profile image file. Only JPEG, PNG, GIF, and WebP files up to 10MB are allowed.');
          }

          // Cek nama file utk cegah path traversal
          if (profileImage.originalname.includes('..') || profileImage.originalname.includes('/') || profileImage.originalname.includes('\\')) {
            throw new Error('Invalid filename.');
          }

          profileImageUrl = `/uploads/profiles/${profileImage.filename || profileImage.originalname}`;
        }
      }
    }

    // Hash password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    // Buat user dan supplier dalam transaksi
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'supplier',
          profileImage: profileImageUrl || null
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
          createdAt: true
        }
      });

      const supplierData: any = {
        userId: user.id,
        name,
      };

      if (stocks) {
        supplierData.stocks = {
          create: stocks.map((stock: any) => ({
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
    const token = jwt.default.sign(
      { id: result.user.id, email: result.user.email, role: result.user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Supplier registered successfully',
      user: result.user,
      supplier: result.supplier,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const createStock = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'supplier') {
    return res.status(403).json({ message: 'Only logged-in suppliers can create stock' });
  }

  try {
    // Validasi input Joi
    const { error, value } = createStockSchema.validate(req.body);
    if (error) {
      throw new Error(error.details?.[0]?.message || 'Validation error');
    }

    const { name, quantity, unit } = value;

    // Handle gambar stok 
    let imageUrl: string | undefined;
    if (req.file) {
      const file = req.file;
      // Validasi tambahan: Cek file kosong
      if (file.size === 0) {
        return res.status(400).json({ message: 'Image file is empty.' });
      }

      // Cek nama file buat utk cegah path traversal
      if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
        return res.status(400).json({ message: 'Invalid filename detected.' });
      }

      // Validasi file gambar
      if (!validateImageFile(file)) {
        return res.status(400).json({ message: 'Invalid image file. Only JPEG, PNG, GIF, and WebP files up to 10MB are allowed.' });
      }

      // File disimpan multer
      const relativePath = path.relative(path.join(process.cwd(), 'src'), file.path);
      imageUrl = `/${relativePath.replace(/\\/g, '/')}`;
    }

    // Cari supplier berdasarkan userId
    const supplier = await prisma.supplier.findUnique({
      where: { userId: req.user.id }
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const stock = await prisma.stock.create({
      data: {
        name,
        quantity: parseFloat(quantity) || 0,
        unit,
        supplierId: supplier.id,
        image: imageUrl, 
      },
      include: { supplier: true },
    });

    res.status(201).json({ message: 'Stock created successfully', data: stock });
  } catch (error) {
    console.error('Error creating stock:', error);
    res.status(500).json({ message: 'Error creating stock', error: (error as Error).message });
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

        // Hitung kuantitas baru
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

    // Menampilkan produk yang terpengaruh (tidak tersedia atau diarsipkan)
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


