import express from "express";
import { getAllGenres } from "../controllers/genreController.js";

const router = express.Router();

router.get("/", getAllGenres);

export default router;
