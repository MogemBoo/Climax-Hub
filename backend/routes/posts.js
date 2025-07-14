import express from "express";
import { createPost, getPosts } from "../controllers/postController.js";

const router = express.Router();

// Create a post
router.post("/", createPost);

// Get posts (optional query: ?user_id=)
router.get("/", getPosts);

export default router;
