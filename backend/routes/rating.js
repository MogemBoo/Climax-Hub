import express from "express";
import {
    addMovieRating,
    addSeriesRating,
    getSeriesRating,
    getMovieRating,
    getAllReviews
} from "../controllers/ratingController.js";

const router = express.Router();

router.post("/movie", addMovieRating);
router.post("/series", addSeriesRating);
router.get("/movie/:user_id/:movie_id", getMovieRating);
router.get("/series/:user_id/:series_id", getSeriesRating);
router.get("/ratings/:user_id", getAllReviews);

export default router;