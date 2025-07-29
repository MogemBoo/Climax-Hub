import pool from '../db.js';

export async function addRecentlyViewed(userId, itemId, itemType) {
  if (!userId || !itemId) return;
  try {
    await pool.query('BEGIN');
    // Remove existing to avoid duplicates
    await pool.query(
      `DELETE FROM recently_viewed WHERE user_id = $1 AND item_id = $2 AND item_type = $3`,
      [userId, itemId, itemType]
    );
    // Insert new
    await pool.query(
      `INSERT INTO recently_viewed (user_id, item_id, item_type) VALUES ($1, $2, $3)`,
      [userId, itemId, itemType]
    );
    // Keep only last 15
    await pool.query(
      `DELETE FROM recently_viewed
       WHERE user_id = $1
       AND id NOT IN (
         SELECT id FROM recently_viewed
         WHERE user_id = $1
         ORDER BY viewed_at DESC
         LIMIT 15
       )`,
      [userId]
    );
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error adding recently viewed:', err);
  }
}
