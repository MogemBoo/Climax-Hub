import pool from "../db.js";

export const getUserProfile = async (req, res) => {
  const user_id = req.params.user_id;

  try {
    // Get user basic info
    const userResult = await pool.query(
      `SELECT user_id, username, created_at FROM users WHERE user_id = $1`,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // Get movie ratings with poster URL and movie_id
    const movieRatings = await pool.query(
      `SELECT 
         m.movie_id,
         m.title,
         m.poster_url,
         mr.rating as score,
         'movie' as type
       FROM movie_review mr
       JOIN movie m ON mr.movie_id = m.movie_id
       WHERE mr.user_id = $1`,
      [user_id]
    );

    // Get series ratings with poster URL and series_id
    const seriesRatings = await pool.query(
      `SELECT 
         s.series_id,
         s.title,
         s.poster_url,
         sr.rating as score,
         'series' as type
       FROM series_review sr
       JOIN series s ON sr.series_id = s.series_id
       WHERE sr.user_id = $1`,
      [user_id]
    );

    // Merge ratings
    const allRatings = [...movieRatings.rows, ...seriesRatings.rows];

    // Get movie watchlist
    const movieWatchlist = await pool.query(
      `SELECT 
         m.movie_id,
         m.title,
         m.poster_url,
         'movie' as type,
         wm.status
       FROM watchlist_movie wm
       JOIN movie m ON wm.movie_id = m.movie_id
       WHERE wm.watchlist_id = (
         SELECT watchlist_id FROM watchlist WHERE user_id = $1
       )`,
      [user_id]
    );

    // Get series watchlist
    const seriesWatchlist = await pool.query(
      `SELECT 
         s.series_id,
         s.title,
         s.poster_url,
         'series' as type,
         ws.status
       FROM watchlist_series ws
       JOIN series s ON ws.series_id = s.series_id
       WHERE ws.watchlist_id = (
         SELECT watchlist_id FROM watchlist WHERE user_id = $1
       )`,
      [user_id]
    );

    const allWatchlist = [...movieWatchlist.rows, ...seriesWatchlist.rows];

    //get user reviews and posts
    const userMovieReviews = await pool.query(
      `SELECT 
         mr.review_id, 
         mr.movie_id, 
         mr.rating,
         mr.comments as content,
         m.title,
         mr.created_at
       FROM movie_review mr
        JOIN movie m ON m.movie_id = mr.movie_id
       WHERE user_id = $1`,
      [user_id]
    );

    const userSeriesReviews = await pool.query(
      `SELECT 
         sr.review_id, 
         sr.series_id,
         sr.rating,
         s.title,
         sr.comments as content,
         sr.created_at
       FROM series_review sr
        JOIN series s ON s.series_id = sr.series_id
       WHERE user_id = $1`,
      [user_id]
    );
    // Combine movie and series reviews
    const userReviews = [...userMovieReviews.rows, ...userSeriesReviews.rows];
    // Format reviews to include type
    userReviews.forEach(review => {
      review.type = review.movie_id ? 'movie' : 'series';
      review.id = review.movie_id || review.series_id; // Use movie_id or series_id
    });
    const reviews = userReviews;

    // Get user posts
    const posts = await pool.query(
      `SELECT 
         post_id,
         content,
         created_at,
         title,
         has_poll
         FROM post_n_poll
        WHERE user_id = $1`,
      [user_id]
    );
    // Format posts to include type
    posts.rows.forEach(post => {
      post.type = post.has_poll ? 'poll' : 'post';
      post.id = post.post_id; // Use post_id as identifier
    });
    res.json({
      user_id: user.user_id,
      username: user.username,
      created_at: user.created_at,
      ratings: allRatings,
      watchlist: allWatchlist,
      reviews,
      posts : posts.rows,
    });

  } catch (err) {
    console.error("Error loading user profile:", err);
    res.status(500).json({ message: "Error loading user profile" });
  }
};
