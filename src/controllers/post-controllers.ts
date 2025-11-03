import type { Request, Response } from "express";
import { posts } from "../models/post-models.js";
import type { Post } from "../models/post-models.js";

export const getPosts = (req: Request, res: Response): void => {
    res.json(posts);
}

export const createPost = (req: Request, res: Response): void => {
    const { title, content, author } = req.body as { title?: string; content?: string; author?: string };
    if (!title || !content || !author) {
        res.status(400).json({ error: "Title, content, and author are required" });
        return;
    }
    const newPost: Post = {
        id: posts.length + 1,
        title: title!,
        content: content!,
        author: author!,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    posts.push(newPost);
    res.status(201).json(newPost);
}

export const deletePost = (req: Request, res: Response): void => {
    const idParam = req.params.id;
    if (!idParam) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    const id = parseInt(idParam);
    const index = posts.findIndex(post => post.id === id);
    if (index === -1) {
        res.status(404).json({ error: "Post not found" });
        return;
    }
    posts.splice(index, 1);
    res.status(204).send();
}
