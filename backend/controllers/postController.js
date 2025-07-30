import pool from "../db.js";

// Helper: convert PFP to base64
const convertPfp = (row) => {
  if (row.pfp) row.pfp = `data:image/png;base64,${row.pfp.toString("base64")}`;
  return row;
};

// Create Post
export const createPost = async (req, res) => {
  const { user_id, title, content } = req.body;
  if (!user_id || !title?.trim() || !content?.trim())
    return res.status(400).json({ message: "User ID, title, and content are required." });

  try {
    const result = await pool.query(
      `INSERT INTO post_n_poll (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING post_id, user_id, title, content, created_at, has_poll`,
      [user_id, title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ message: "Failed to create post." });
  }
};

// Create Poll
export const createPoll = async (req, res) => {
  const { user_id, title, options } = req.body;
  if (!user_id || !title?.trim() || !options?.length)
    return res.status(400).json({ message: "User ID, title, and options are required." });

  try {
    const result = await pool.query(
      `INSERT INTO post_n_poll (user_id, title, content, has_poll)
       VALUES ($1, $2, '', true)
       RETURNING post_id`,
      [user_id, title]
    );

    const postId = result.rows[0].post_id;

    // Insert options
    for (const opt of options) {
      await pool.query(
        `INSERT INTO poll_option (post_id, option_text) VALUES ($1, $2)`,
        [postId, opt]
      );
    }

    res.status(201).json({ post_id: postId });
  } catch (err) {
    console.error("Error creating poll:", err);
    res.status(500).json({ message: "Failed to create poll." });
  }
};

// Get All Posts (with poll options + vote counts)
export const getPosts = async (req, res) => {
  const userId = req.query.user_id || 0;
  try {
    const postsResult = await pool.query(
      `SELECT p.post_id, p.user_id, u.username, u.pfp, p.title, p.content, p.created_at, p.has_poll
       FROM post_n_poll p
       JOIN users u ON p.user_id = u.user_id
       ORDER BY p.created_at DESC`
    );

    const posts = postsResult.rows.map(convertPfp);
    if (posts.length === 0) return res.json([]);

    const postIds = posts.map(p => p.post_id);

    // Comments
    const commentsRes = await pool.query(
      `SELECT c.comment_id, c.post_id, c.content, c.created_at, u.username, u.pfp, u.user_id
       FROM post_comment c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.post_id = ANY($1::int[])
       ORDER BY c.created_at DESC`,
      [postIds]
    );
    const comments = commentsRes.rows.map(convertPfp);

    // Poll options with votes
    const pollOptionsRes = await pool.query(
      `SELECT po.option_id, po.post_id, po.option_text,
              COUNT(v.user_id) AS votes
       FROM poll_option po
       LEFT JOIN vote v ON po.option_id = v.option_id
       WHERE po.post_id = ANY($1::int[])
       GROUP BY po.option_id`,
      [postIds]
    );

    // User's selected option
    const userVotesRes = await pool.query(
      `SELECT v.option_id, po.post_id 
       FROM vote v
       JOIN poll_option po ON v.option_id = po.option_id
       WHERE v.user_id = $1 AND po.post_id = ANY($2::int[])`,
      [userId, postIds]
    );

    const userVotes = userVotesRes.rows;

    const postsWithData = posts.map(post => ({
      ...post,
      comments: comments.filter(c => c.post_id === post.post_id).slice(0, 3),
      poll_options: post.has_poll
        ? pollOptionsRes.rows.filter(opt => opt.post_id === post.post_id).map(opt => ({
            ...opt,
            voted: userVotes.some(v => v.option_id === opt.option_id)
          }))
        : []
    }));

    res.json(postsWithData);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Failed to fetch posts." });
  }
};

// Vote on a poll
export const votePoll = async (req, res) => {
  const { postId } = req.params;
  const { user_id, option_id } = req.body;

  if (!user_id || !option_id)
    return res.status(400).json({ message: "User ID and option ID are required." });

  try {
    // Remove previous vote by this user for this post
    await pool.query(
      `DELETE FROM vote WHERE user_id = $1 AND option_id IN 
       (SELECT option_id FROM poll_option WHERE post_id = $2)`,
      [user_id, postId]
    );

    // Add new vote
    await pool.query(
      `INSERT INTO vote (user_id, option_id) VALUES ($1, $2)`,
      [user_id, option_id]
    );

    // Return updated poll options
    const updatedPoll = await pool.query(
      `SELECT po.option_id, po.post_id, po.option_text,
              COUNT(v.user_id) AS votes
       FROM poll_option po
       LEFT JOIN vote v ON po.option_id = v.option_id
       WHERE po.post_id = $1
       GROUP BY po.option_id`,
      [postId]
    );

    res.json({ poll_options: updatedPoll.rows });
  } catch (err) {
    console.error("Error voting in poll:", err);
    res.status(500).json({ message: "Failed to vote in poll." });
  }
};

// Get a single post (for modal)
export const getPostById = async (req, res) => {
  const { postId } = req.params;
  const userId = req.query.user_id || 0;

  try {
    const postRes = await pool.query(
      `SELECT p.post_id, p.user_id, u.username, u.pfp, p.title, p.content, p.created_at, p.has_poll
       FROM post_n_poll p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.post_id = $1`,
      [postId]
    );

    if (postRes.rows.length === 0) return res.status(404).json({ message: "Post not found." });
    const post = convertPfp(postRes.rows[0]);

    const commentsRes = await pool.query(
      `SELECT c.comment_id, c.post_id, c.content, c.created_at, u.username, u.pfp, u.user_id
       FROM post_comment c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC`,
      [postId]
    );
    const comments = commentsRes.rows.map(convertPfp);

    const pollOptionsRes = await pool.query(
      `SELECT po.option_id, po.post_id, po.option_text,
              COUNT(v.user_id) AS votes
       FROM poll_option po
       LEFT JOIN vote v ON po.option_id = v.option_id
       WHERE po.post_id = $1
       GROUP BY po.option_id`,
      [postId]
    );

    const userVotesRes = await pool.query(
      `SELECT option_id FROM vote WHERE user_id = $1 AND option_id IN 
       (SELECT option_id FROM poll_option WHERE post_id = $2)`,
      [userId, postId]
    );
    const userVotes = userVotesRes.rows;

    res.json({
      ...post,
      comments,
      poll_options: post.has_poll
        ? pollOptionsRes.rows.map(opt => ({
            ...opt,
            voted: userVotes.some(v => v.option_id === opt.option_id)
          }))
        : []
    });
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ message: "Failed to fetch post." });
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
