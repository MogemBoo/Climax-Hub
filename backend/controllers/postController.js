import pool from "../db.js";

// Helper to convert pfp from bytea to base64 (if needed)
const convertPfp = (row) => {
  if (row.pfp) {
    row.pfp = `data:image/png;base64,${row.pfp.toString("base64")}`;
  }
  return row;
};

// Create a new post
export const createPost = async (req, res) => {
  const { user_id, title, content } = req.body;

  if (!user_id || !title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "User ID, title, and content are required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO post_n_poll (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING post_id, user_id, title, content, created_at, has_poll`,
      [user_id, title, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post." });
  }
};

// Create a new poll
export const createPoll = async (req, res) => {
  const { user_id, title, content, options } = req.body;

  if (!user_id || !title?.trim() || !content?.trim() || !options?.length) {
    return res.status(400).json({ message: "User ID, title, content, and options are required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO post_n_poll (user_id, title, content, has_poll)
       VALUES ($1, $2, $3, true)
       RETURNING post_id`,
      [user_id, title, content]
    );

    const postId = result.rows[0].post_id;

    // Insert poll options
    for (const option of options) {
      await pool.query(
        `INSERT INTO poll_option (post_id, option_text)
         VALUES ($1, $2)`,
        [postId, option]
      );
    }

    res.status(201).json({ post_id: postId });
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({ message: "Failed to create poll." });
  }
};

// Get all posts with aggregated votes & user's vote
export const getPosts = async (req, res) => {
  const userId = req.query.user_id;

  try {
    let query = `
      SELECT 
        p.post_id, 
        p.user_id, 
        u.username, 
        u.pfp, 
        p.title, 
        p.content, 
        p.created_at, 
        p.has_poll,
        COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0) AS upvote,
        COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END), 0) AS downvote,
        COALESCE(MAX(CASE WHEN v.user_id = $1 THEN v.vote_type ELSE 0 END), 0) AS user_vote
      FROM post_n_poll p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN post_vote v ON p.post_id = v.post_id
      GROUP BY p.post_id, u.username, u.pfp
      ORDER BY p.created_at DESC
    `;
    const postsResult = await pool.query(query, [userId || 0]);
    const posts = postsResult.rows.map((row) => {
      if (row.pfp) row.pfp = `data:image/png;base64,${row.pfp.toString("base64")}`;
      return row;
    });

    // Fetch top 3 comments
    if (posts.length === 0) return res.json([]);
    const postIds = posts.map((p) => p.post_id);
    const commentsRes = await pool.query(
      `SELECT c.comment_id, c.post_id, c.content, c.created_at, u.username, u.pfp
       FROM post_comment c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.post_id = ANY($1::int[])
       ORDER BY c.created_at DESC`,
      [postIds]
    );

    const comments = commentsRes.rows.map((row) => {
      if (row.pfp) row.pfp = `data:image/png;base64,${row.pfp.toString("base64")}`;
      return row;
    });

    const postsWithComments = posts.map((post) => ({
      ...post,
      comments: comments.filter((c) => c.post_id === post.post_id).slice(0, 3),
    }));

    res.json(postsWithComments);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts." });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  const { postId } = req.params;
  const { title, content } = req.body;

  if (!postId || !title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "Post ID, title, and content are required." });
  }

  try {
    const result = await pool.query(
      `UPDATE post_n_poll
       SET title = $1, content = $2
       WHERE post_id = $3
       RETURNING post_id, user_id, title, content, created_at, has_poll`,
      [title, content, postId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Post not found." });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Failed to update post." });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  const { postId } = req.params;

  if (!postId) return res.status(400).json({ message: "Post ID is required." });

  try {
    const result = await pool.query(
      `DELETE FROM post_n_poll
       WHERE post_id = $1
       RETURNING post_id`,
      [postId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Post not found." });

    res.json({ message: "Post deleted successfully.", post_id: postId });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Failed to delete post." });
  }
};

// Vote or unvote a post
export const votePost = async (req, res) => {
  const { post_id } = req.params;
  const { user_id, vote_type } = req.body; // 1 = upvote, -1 = downvote

  if (!user_id || ![1, -1].includes(vote_type)) {
    return res.status(400).json({ error: "Invalid vote data" });
  }

  try {
    // Check if user already voted
    const existing = await pool.query(
      "SELECT vote_type FROM post_vote WHERE post_id = $1 AND user_id = $2",
      [post_id, user_id]
    );

    if (existing.rows.length > 0) {
      const currentVote = existing.rows[0].vote_type;
      if (currentVote === vote_type) {
        // Same vote clicked again → remove it
        await pool.query(
          "DELETE FROM post_vote WHERE post_id = $1 AND user_id = $2",
          [post_id, user_id]
        );
      } else {
        // Different vote → update it
        await pool.query(
          "UPDATE post_vote SET vote_type = $1 WHERE post_id = $2 AND user_id = $3",
          [vote_type, post_id, user_id]
        );
      }
    } else {
      // No previous vote → insert new
      await pool.query(
        "INSERT INTO post_vote (post_id, user_id, vote_type) VALUES ($1, $2, $3)",
        [post_id, user_id, vote_type]
      );
    }

    // Return updated counts & user's current vote
    const countsRes = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END), 0) AS upvote,
         COALESCE(SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END), 0) AS downvote
       FROM post_vote WHERE post_id = $1`,
      [post_id]
    );

    const userVoteRes = await pool.query(
      "SELECT vote_type FROM post_vote WHERE post_id = $1 AND user_id = $2",
      [post_id, user_id]
    );

    res.json({
      post_id,
      upvote: countsRes.rows[0].upvote,
      downvote: countsRes.rows[0].downvote,
      user_vote: userVoteRes.rows.length ? userVoteRes.rows[0].vote_type : 0,
    });
  } catch (err) {
    console.error("Error in votePost:", err);
    res.status(500).json({ error: "Server error" });
  }
};
