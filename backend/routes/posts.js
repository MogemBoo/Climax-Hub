import express from "express";
import {
    createPost,
    getPosts,
    updatePost,
    deletePost,
    upvotePost,
    downvotePost,
} from "../controllers/postController.js";

import {
    addComment,
    getComments
} from "../controllers/commentsController.js";

const router = express.Router();

// Post routes
router.post("/", createPost);
router.get("/", getPosts);
router.put("/:postId", updatePost);
router.delete("/:postId", deletePost);
router.post("/:post_id/upvote", upvotePost);
router.post("/:post_id/downvote", downvotePost);

// Add comment to a post
router.post("/:postId/comments", addComment);

// Get comments for a post
router.get("/:postId/comments", getComments);

export default router;
