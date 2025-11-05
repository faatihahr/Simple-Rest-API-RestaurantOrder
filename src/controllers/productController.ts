import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

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
    const newProduct = await prisma.products.create({
      data: {
        name,
        price,
        description,
        categoryId
      }
    });
    res.status(201).json({ message: 'Product created successfully', data: newProduct });
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  const { name, price, description, categoryId } = req.body;
  try {
    const updatedProduct = await prisma.products.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price }),
        ...(description !== undefined && { description }),
        ...(categoryId !== undefined && { categoryId })
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
