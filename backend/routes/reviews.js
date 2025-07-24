import express from "express";
import {updateReview} from "../controllers/reviewController.js";

const router = express.Router();

router.put("/:reviewId", updateReview);

export default router;