import express from 'express';
import {getUserWatchlist, addToWatchlist} from "../controllers/watchlistController.js";

const router = express.Router();

router.get('/:user_id', getUserWatchlist);
router.post('/add', addToWatchlist);

export default router;