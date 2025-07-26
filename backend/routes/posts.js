import express from "express";
import {
    createPost,
    getPosts,
    updatePost,
    deletePost
} from "../controllers/postController.js";

const router = express.Router();

router.put("/:postId", updatePost);
// Create a post
router.post("/", createPost);

// Get posts
router.get("/", getPosts);

// Delete a post
router.delete("/:postId", deletePost);

export default router;
