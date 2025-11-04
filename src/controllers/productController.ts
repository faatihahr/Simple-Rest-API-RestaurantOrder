import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.products.findMany();
    res.json(products);
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
      res.json(product);
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
    res.status(201).json(newProduct);
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
    res.json(updatedProduct);
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
    res.json(deletedProduct);
  } catch (error) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.status(500).json({ message: 'Error deleting product', error });
    }
  }
};
