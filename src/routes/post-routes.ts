import { Router } from "express";
import { getPosts, createPost, deletePost } from "../controllers/post-controllers.js";

const router = Router();

// Read all posts
router.get("/", getPosts);

// Create a new post
router.post("/posts", createPost);

// Delete a post by id
router.delete("/posts/:id", deletePost);

export default router;
