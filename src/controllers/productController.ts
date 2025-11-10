import type { Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import prisma from '../lib/prisma.js';
import { saveUploadedFile, validateImageFile, getUploadedFiles } from '../lib/upload.js';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, sort, limit, offset } = req.query;

    const where: any = {};
    if (category) {
      where.categoryId = parseInt(category as string);
    }

    const orderBy: any = {};
    if (sort) {
      const [field, direction] = (sort as string).split(':');
      if (field) {
        orderBy[field] = direction === 'desc' ? 'desc' : 'asc';
      }
    }

    const take = limit ? parseInt(limit as string) : undefined;
    const skip = offset ? parseInt(offset as string) : undefined;

    const products = await prisma.products.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        category: true,
        images: true,
        favorites: true,
        reviews: true
      }
    });
    res.json({ message: 'Products fetched successfully', data: products });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  try {
    const product = await prisma.products.findUnique({
      where: { id }
    });
    if (product) {
      res.json({ message: 'Product fetched successfully', data: product });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, price, description, categoryId } = req.body;
  if (!name || !price || !description || !categoryId) {
    return res.status(400).json({ message: 'Name, price, description, and categoryId are required' });
  }

  try {
    // Handle single product image from multer
    let imageUrl: string | undefined;
    if (req.file) {
      const file = req.file;
      // Additional validation: Check for empty files
      if (file.size === 0) {
        return res.status(400).json({ message: 'Image file is empty.' });
      }

      // Check filename for path traversal attempts
      if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
        return res.status(400).json({ message: 'Invalid filename detected.' });
      }

      // Validate image file
      if (!validateImageFile(file)) {
        return res.status(400).json({ message: 'Invalid image file. Only JPEG, PNG, GIF, and WebP files up to 10MB are allowed.' });
      }

      // File is already saved by multer, just return the path
      const relativePath = path.relative(path.join(process.cwd(), 'src'), file.path);
      imageUrl = `/${relativePath.replace(/\\/g, '/')}`;
    } else {
      return res.status(400).json({ message: 'Product image is required' });
    }

    const newProduct = await prisma.products.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        categoryId: parseInt(categoryId),
        images: imageUrl ? {
          create: [{ url: imageUrl }]
        } : undefined
      },
      include: {
        images: true,
        category: true
      }
    });

    res.status(201).json({ message: 'Product created successfully', data: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: (error as Error).message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  const { name, price, description, categoryId } = req.body;

  try {
    const files = getUploadedFiles(req);
    const imageUrls: string[] = [];
    const imageFiles: fileUpload.UploadedFile[] = [];

    if (files) {
      if (files.images) {
        const imgs = Array.isArray(files.images) ? files.images : [files.images];
        imageFiles.push(...imgs);
      }
      if (files.image) {
        const imgs = Array.isArray(files.image) ? files.image : [files.image];
        imageFiles.push(...imgs);
      }
      if (files.files) {
        const imgs = Array.isArray(files.files) ? files.files : [files.files];
        imageFiles.push(...imgs);
      }
    }

    // Check current image count to prevent exceeding limit
    const currentProduct = await prisma.products.findUnique({
      where: { id },
      include: { images: true }
    });

    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (currentProduct.images.length + imageFiles.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 images allowed per product' });
    }

    for (const file of imageFiles) {
      // Additional validation: Check for empty files
      if (file.size === 0) {
        return res.status(400).json({ message: 'One or more image files are empty.' });
      }

      // Check filename for path traversal attempts
      if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        return res.status(400).json({ message: 'Invalid filename detected.' });
      }

      if (!validateImageFile(file)) {
        return res.status(400).json({ message: 'Invalid image file. Only JPEG, PNG, GIF, and WebP files up to 10MB are allowed.' });
      }
      const imageUrl = await saveUploadedFile(file, 'products');
      imageUrls.push(imageUrl);
    }

    const updateData: any = {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price }),
      ...(description !== undefined && { description }),
      ...(categoryId !== undefined && { categoryId })
    };

    if (imageUrls.length > 0) {
      updateData.images = {
        create: imageUrls.map(url => ({ url }))
      };
    }

    const updatedProduct = await prisma.products.update({
      where: { id },
      data: updateData,
      include: {
        images: true
      }
    });

    res.json({ message: 'Product updated successfully', data: updatedProduct });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.status(500).json({ message: 'Error updating product', error });
    }
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  try {
    const deletedProduct = await prisma.products.delete({
      where: { id }
    });
    res.json({ message: 'Product deleted successfully', data: deletedProduct });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.status(500).json({ message: 'Error deleting product', error });
    }
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryName } = req.params;
    if (!categoryName) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const { limit, offset } = req.query;

    const categoryMap: { [key: string]: string } = {
      food: 'Food',
      beverages: 'Beverages'
    };

    const dbCategoryName = categoryMap[categoryName.toLowerCase()];
    if (!dbCategoryName) {
      return res.status(400).json({ message: 'Invalid category name. Use "food" or "beverages".' });
    }

    const take = limit ? parseInt(limit as string) : undefined;
    const skip = offset ? parseInt(offset as string) : undefined;

    const products = await prisma.products.findMany({
      where: {
        category: {
          name: dbCategoryName
        }
      },
      take,
      skip,
      include: {
        category: true,
        images: true,
        favorites: true,
        reviews: true
      }
    });

    const grouped = {
      [dbCategoryName]: products
    };

    res.json({ message: 'Products by category fetched successfully', data: grouped });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products by category', error });
  }
};
