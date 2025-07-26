import pool from "../db.js";

export const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { content, type } = req.body;

  if (!type || !["movie", "series"].includes(type)) {
    return res.status(400).json({ error: "Invalid or missing review type." });
  }

  const table = type === "movie" ? "movie_review" : "series_review";

  try {
    const result = await pool.query(
      `UPDATE ${table}
       SET comments = $1
       WHERE review_id = $2
       RETURNING *`,
      [content, reviewId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.status(200).json({ message: "Review updated", review: result.rows[0] });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const { type } = req.body;

  if (!type || !["movie", "series"].includes(type)) {
    return res.status(400).json({ error: "Invalid or missing review type." });
  }

  const table = type === "movie" ? "movie_review" : "series_review";

  try {
    const result = await pool.query(
      `DELETE FROM ${table}
       WHERE review_id = $1
       RETURNING *`,
      [reviewId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.status(200).json({ message: "Review deleted", review: result.rows[0] });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};