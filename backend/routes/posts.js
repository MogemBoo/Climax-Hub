import express from "express";
import {
    createPost,
    getPosts,
    updatePost,
    deletePost,
    votePost
} from "../controllers/postController.js";

import {
    addComment,
    getComments,
    deleteComment
} from "../controllers/commentsController.js";

const router = express.Router();

// Post routes
router.post("/", createPost);
router.get("/", getPosts);
router.put("/:postId", updatePost);
router.delete("/:postId", deletePost);
router.post("/:post_id/vote", votePost);

// Add comment to a post
router.post("/:postId/comments", addComment);

// Get comments for a post
router.get("/:postId/comments", getComments);

//delete comment
router.delete("/:comment_id", deleteComment);

export default router;
