import express from 'express';
import pool from '../db.js';
const router = express.Router();

router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT rv.item_id, rv.item_type, rv.viewed_at,
             CASE WHEN rv.item_type = 'movie' THEN m.title ELSE s.title END AS title,
             CASE WHEN rv.item_type = 'movie' THEN m.poster_url ELSE s.poster_url END AS poster_url,
             CASE WHEN rv.item_type = 'movie' THEN m.rating ELSE s.rating END AS rating,
             CASE WHEN rv.item_type = 'movie' THEN m.release_date ELSE s.start_date END AS release_date
      FROM recently_viewed rv
      LEFT JOIN movie m ON rv.item_type = 'movie' AND rv.item_id = m.movie_id
      LEFT JOIN series s ON rv.item_type = 'series' AND rv.item_id = s.series_id
      WHERE rv.user_id = $1
      ORDER BY rv.viewed_at DESC
      LIMIT 15
    `, [user_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching recently viewed:', err);
    res.status(500).json({ error: 'Failed to fetch recently viewed' });
  }
});

export default router;
