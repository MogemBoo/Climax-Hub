import express from "express";
import {
    addMovieRating,
    addSeriesRating,
    getSeriesRating,
    getMovieRating,
    getAllReviews,
    addEpisodeRating,
    getUserEpisodeRatings
} from "../controllers/ratingController.js";

const router = express.Router();

router.post("/movie", addMovieRating);
router.post("/series", addSeriesRating);
router.get("/movie/:user_id/:movie_id", getMovieRating);
router.get("/series/:user_id/:series_id", getSeriesRating);
router.get("/ratings/:user_id", getAllReviews);
router.post("/episode", addEpisodeRating);
router.get("/episode/:user_id/:series_id", getUserEpisodeRatings);


export default router;