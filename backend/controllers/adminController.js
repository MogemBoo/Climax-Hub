// controllers/adminController.js
import pool from '../db.js'; // Assuming your database connection pool is in db.js

export const getUserLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
          ul.log_id,
          ul.user_id,
          u.username,
          ul.login_time,
          ul.logout_time,
          ul.ip_address
      FROM
          user_log ul
      JOIN
          users u ON ul.user_id = u.user_id
      ORDER BY
          ul.login_time DESC;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user logs:', error);
    res.status(500).json({ error: 'Failed to fetch user logs' });
  }
};

// You can add other admin-related controller functions here later