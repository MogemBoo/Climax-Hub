import pool from "../db.js";

export const addComment = async (req, res) => {
  const { postId } = req.params;
  const { user_id, content } = req.body;

  if (!user_id || !content || !postId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO post_comment (post_id, user_id, content, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [postId, user_id, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getComments = async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await pool.query(
      `SELECT c.*, u.username
       FROM post_comment c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC`,
      [postId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
