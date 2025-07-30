import express from "express";
import { getRecentlyViewed } from "../controllers/recentlyViewedController.js";

const router = express.Router();
router.get("/:user_id", getRecentlyViewed);

export default router;
