import express from "express";
import { createPost, getPosts, updatePost } from "../controllers/postController.js";

const router = express.Router();

router.put("/:postId", updatePost);
// Create a post
router.post("/", createPost);

// Get posts
router.get("/", getPosts);

export default router;
