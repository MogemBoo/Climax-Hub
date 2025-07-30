import express from "express";
import {
    createPost,
    getPosts,
    updatePost,
    deletePost,
    votePost,
    createPoll,
    votePoll,
    getPostById
} from "../controllers/postController.js";

import {
    addComment,
    getComments,
    deleteComment
} from "../controllers/commentsController.js";

const router = express.Router();

// Create a new post or poll
router.post("/polls", createPoll);

// Post routes
router.post("/", createPost);
router.get("/", getPosts);
router.put("/:postId", updatePost);
router.delete("/:postId", deletePost);
router.get("/:postId", getPostById);
router.post("/:post_id/vote", votePost);
router.post("/:postId/poll-vote", votePoll);
// Add comment to a post
router.post("/:postId/comments", addComment);

// Get comments for a post
router.get("/:postId/comments", getComments);

//delete comment
router.delete("/:postId/comments/:commentId", deleteComment);

export default router;
