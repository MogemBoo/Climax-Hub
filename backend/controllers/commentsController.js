import pool from "../db.js";

// Helper: convert bytea PFP to Base64
function convertPfp(row) {
  if (row.pfp) {
    return { ...row, pfp: `data:image/png;base64,${row.pfp.toString("base64")}` };
  }
  return { ...row, pfp: null };
}

// Add a comment
export const addComment = async (req, res) => {
  const { postId } = req.params;
  const { user_id, content } = req.body;

  if (!user_id || !content?.trim() || !postId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO post_comment (post_id, user_id, content, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING comment_id, post_id, user_id, content, created_at`,
      [postId, user_id, content]
    );

    // Fetch username + pfp for the new comment
    const userData = await pool.query(
      `SELECT username, pfp FROM users WHERE user_id = $1`,
      [user_id]
    );

    const enrichedComment = {
      ...result.rows[0],
      username: userData.rows[0].username,
      pfp: userData.rows[0].pfp
        ? `data:image/png;base64,${userData.rows[0].pfp.toString("base64")}`
        : null,
    };

    res.status(201).json(enrichedComment);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all comments for a post
export const getComments = async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await pool.query(
      `SELECT c.comment_id, c.post_id, c.content, c.created_at,c.user_id,
              u.username, u.pfp
       FROM post_comment c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC`,
      [postId]
    );

    // Convert all pfps
    const commentsWithPfp = result.rows.map(convertPfp);
    res.json(commentsWithPfp);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) return res.status(400).json({ message: "Comment ID is required." });

  try {
    const result = await pool.query(
      `DELETE FROM post_comment WHERE comment_id = $1 RETURNING comment_id`,
      [commentId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Comment not found." });

    res.json({ message: "Comment deleted successfully.", comment_id: commentId });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment." });
  }
};
