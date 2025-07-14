import express from 'express';
import { getUserRecommendations } from '../controllers/recommendationController.js';

const router = express.Router();

router.get('/:user_id', getUserRecommendations);

export default router;