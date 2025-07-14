import express from "express";
import { getUserProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/:user_id", getUserProfile);

export default router;
