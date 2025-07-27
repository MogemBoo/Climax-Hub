import pool from "../db.js";

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
       RETURNING post_id, user_id, title, content, created_at, has_poll, upvote, downvote`,
      [user_id, title, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post." });
  }
};

//create a new poll
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

// Get all posts (optionally by user)
export const getPosts = async (req, res) => {
  const userId = req.query.user_id;

  try {
    let query = `SELECT p.post_id, p.user_id, u.username, p.title, p.content, p.created_at, p.has_poll, p.upvote, p.downvote
                 FROM post_n_poll p
                 JOIN users u ON p.user_id = u.user_id`;
    let params = [];

    if (userId) {
      query += ` WHERE p.user_id = $1`;
      params.push(userId);
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts." });
  }
};

//update existing post
export const updatePost = async (req, res) => {
  const { postId } = req.params;
  if (!postId) {
    return res.status(400).json({ message: "Post ID is required." });
  }
  const { title, content } = req.body;

  if (!postId || !title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "Post ID, title, and content are required." });
  }

  try {
    const result = await pool.query(
      `UPDATE post_n_poll
       SET title = $1, content = $2
       WHERE post_id = $3
       RETURNING post_id, user_id, title, content, created_at, has_poll, upvote, downvote`,
      [title, content, postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Failed to update post." });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    return res.status(400).json({ message: "Post ID is required." });
  }

  try {
    const result = await pool.query(
      `DELETE FROM post_n_poll
       WHERE post_id = $1
       RETURNING post_id`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found." });
    }

    res.json({ message: "Post deleted successfully.", post_id: postId });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Failed to delete post." });
  }
};

export const upvotePost = async (req, res) => {
  const { post_id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE post_n_poll SET upvote = upvote + 1 WHERE post_id = $1 RETURNING *",
      [post_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error in upvotePost:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const downvotePost = async (req, res) => {
  const { post_id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE post_n_poll SET downvote = downvote + 1 WHERE post_id = $1 RETURNING *",
      [post_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error in downvotePost:", err);
    res.status(500).json({ error: "Server error" });
  }
};