import express from 'express';
import {
    addFullMovie,
    getRecentMovies,
    getTopRatedMovies,
    searchMovies,
    getAllMovies,
    getMovieById,
    getPerStarUserCount,
    getReviewsByRating,
    getTrendingMovies,
    getMoviesByGenre,
    getComingSoonMovies
} from '../controllers/moviesController.js';

const router = express.Router();

router.get('/coming-soon', getComingSoonMovies);
router.get('/trending', getTrendingMovies);
router.post('/full', addFullMovie);
router.get('/top', getTopRatedMovies);
router.get('/recent', getRecentMovies);
router.get('/search', searchMovies);
router.get('/all', getAllMovies);
router.get('/genre/:genre', getMoviesByGenre);

router.get('/:id', getMovieById);
router.get('/:id/per-star-user-count', getPerStarUserCount);
router.get('/:id/reviews/:rating', getReviewsByRating);

export default router;
