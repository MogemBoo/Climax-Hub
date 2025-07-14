import express from "express";
import { addMovieRating, addSeriesRating, getSeriesRating, getMovieRating } from "../controllers/ratingController.js";

const router = express.Router();

router.post("/movie", addMovieRating);
router.post("/series", addSeriesRating);
router.get("/movie/:user_id/:movie_id", getMovieRating);
router.get("/series/:user_id/:series_id", getSeriesRating);

export default router;