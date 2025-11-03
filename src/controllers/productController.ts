import type { Request, Response } from 'express';
import { products } from '../models/Product.js';
import type { Product } from '../models/Product.js';

export const getProducts = (req: Request, res: Response) => {
  res.json(products);
};

export const getProductById = (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  const product = products.find(p => p.id === id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

export const createProduct = (req: Request, res: Response) => {
  const { name, price, description } = req.body;
  if (!name || !price || !description) {
    return res.status(400).json({ message: 'Name, price, and description are required' });
  }
  const newProduct: Product = {
    id: products.length + 1,
    name,
    price,
    description,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
};

export const updateProduct = (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  const productIndex = products.findIndex(p => p.id === id);
  if (productIndex !== -1) {
    const { name, price, description } = req.body;
    if (name !== undefined) products[productIndex]!.name = name;
    if (price !== undefined) products[productIndex]!.price = price;
    if (description !== undefined) products[productIndex]!.description = description;
    res.json(products[productIndex]);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

export const deleteProduct = (req: Request, res: Response) => {
  const id = parseInt(req.params.id!);
  const productIndex = products.findIndex(p => p.id === id);
  if (productIndex !== -1) {
    const deletedProduct = products.splice(productIndex, 1);
    res.json(deletedProduct);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};
