import prisma from '../lib/prisma.js';
import { saveUploadedFile, validateImageFile, getUploadedFiles } from '../lib/upload.js';
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
        res.json({ message: 'Products fetched successfully', data: products });
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
            res.json({ message: 'Product fetched successfully', data: product });
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
        const files = getUploadedFiles(req);
        const imageUrls = [];
        if (files && files.images) {
            const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
            // Limit to maximum 10 images per product
            if (imageFiles.length > 10) {
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
        }
        const newProduct = await prisma.products.create({
            data: {
                name,
                price,
                description,
                categoryId,
                images: {
                    create: imageUrls.map(url => ({ url }))
                }
            },
            include: {
                images: true
            }
        });
        res.status(201).json({ message: 'Product created successfully', data: newProduct });
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating product', error });
    }
};
export const updateProduct = async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price, description, categoryId } = req.body;
    try {
        const files = getUploadedFiles(req);
        const imageUrls = [];
        if (files && files.images) {
            const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
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
        }
        const updateData = {
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
        res.json({ message: 'Product deleted successfully', data: deletedProduct });
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
export const getProductsByCategory = async (req, res) => {
    try {
        const { categoryName } = req.params;
        if (!categoryName) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        const { limit, offset } = req.query;
        const categoryMap = {
            food: 'Food',
            beverages: 'Beverages'
        };
        const dbCategoryName = categoryMap[categoryName.toLowerCase()];
        if (!dbCategoryName) {
            return res.status(400).json({ message: 'Invalid category name. Use "food" or "beverages".' });
        }
        const take = limit ? parseInt(limit) : undefined;
        const skip = offset ? parseInt(offset) : undefined;
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching products by category', error });
    }
};
//# sourceMappingURL=productController.js.map