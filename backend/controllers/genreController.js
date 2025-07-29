import pool from "../db.js";

// Get all genres
export const getAllGenres = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT genre_id, name FROM genre ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching genres:", err);
    res.status(500).json({ message: "Failed to fetch genres." });
  }
};
