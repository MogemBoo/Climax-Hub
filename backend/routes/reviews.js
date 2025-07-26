import express from "express";
import {
    updateReview,
    deleteReview
} from "../controllers/reviewController.js";

const router = express.Router();

router.put("/:reviewId", updateReview);
router.delete("/:reviewId", deleteReview);

export default router;