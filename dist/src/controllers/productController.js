import prisma from '../lib/prisma.js';
export const getProducts = async (req, res) => {
    try {
        const { category, sort, limit, offset } = req.query;
        const where = {};
        if (category) {
            where.categoryId = parseInt(category);
        }
        const orderBy = {};
        if (sort) {
            const [field, direction] = sort.split(':');
            if (field) {
                orderBy[field] = direction === 'desc' ? 'desc' : 'asc';
            }
        }
        const take = limit ? parseInt(limit) : undefined;
        const skip = offset ? parseInt(offset) : undefined;
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
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};
export const getProductById = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const product = await prisma.products.findUnique({
            where: { id }
        });
        if (product) {
            res.json(product);
        }
        else {
            res.status(404).json({ message: 'Product not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching product', error });
    }
};
export const createProduct = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating product', error });
    }
};
export const updateProduct = async (req, res) => {
    const id = parseInt(req.params.id);
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
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'Product not found' });
        }
        else {
            res.status(500).json({ message: 'Error updating product', error });
        }
    }
};
export const deleteProduct = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const deletedProduct = await prisma.products.delete({
            where: { id }
        });
        res.json(deletedProduct);
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'Product not found' });
        }
        else {
            res.status(500).json({ message: 'Error deleting product', error });
        }
    }
};
//# sourceMappingURL=productController.js.map