import express from 'express';
import {
    addFullSeries,
    getAllSeries,
    getRecentSeries,
    getTopRatedSeries,
    searchSeries,
    getSeriesById,
    getSeriesEpisodes,
    getPerStarUserCount,
    getTrendingSeries
} from '../controllers/seriesController.js';

const router = express.Router();

router.get('/trending', getTrendingSeries);
router.post('/full', addFullSeries);
router.get('/top', getTopRatedSeries);
router.get('/recent', getRecentSeries);
router.get('/search', searchSeries);
router.get('/all', getAllSeries);
router.get('/:id', getSeriesById);
router.get('/:id/episodes', getSeriesEpisodes);
router.get('/per-star-user-count', getPerStarUserCount);

export default router;
