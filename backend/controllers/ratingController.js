import pool from "../db.js";

export const addMovieRating = async (req, res) => {
  const { user_id, movie_id, rating, comments } = req.body;

  console.log('addMovieRating called with:', { user_id, movie_id, rating, comments });

  if (!user_id || !movie_id || rating === undefined) {
    console.log('Missing required fields:', { user_id, movie_id, rating });
    return res.status(400).json({ message: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const check = await client.query(
      `SELECT * FROM movie_review WHERE user_id = $1 AND movie_id = $2`,
      [user_id, movie_id]
    );
    console.log('Existing review check:', check.rows);

    let result;

    if (check.rows.length > 0) {
      result = await client.query(
        `UPDATE movie_review
         SET rating = $1, comments = $2, created_at = CURRENT_TIMESTAMP
         WHERE user_id = $3 AND movie_id = $4
         RETURNING *`,
        [rating, comments || null, user_id, movie_id]
      );
      console.log('Updated review:', result.rows[0]);
      res.status(200).json({ message: "Movie rating updated", review: result.rows[0] });
    } else {
      result = await client.query(
        `INSERT INTO movie_review (user_id, movie_id, rating, comments)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [user_id, movie_id, rating, comments || null]
      );
      console.log('Inserted review:', result.rows[0]);
      res.status(201).json({ message: "Movie rating added", review: result.rows[0] });
    }

    // Popularity increment capped at 2 max for rating 10, proportional otherwise
    if (rating > 0) {
      const popularityIncrement = Math.min((rating / 10) * 2, 2);
      await client.query(
        `INSERT INTO movie_popularity (movie_id, popularity, last_updated)
         VALUES ($1, $2, NOW())
         ON CONFLICT (movie_id) DO UPDATE
         SET popularity = movie_popularity.popularity + EXCLUDED.popularity,
             last_updated = NOW()`,
        [movie_id, popularityIncrement]
      );
    }

    await client.query("SELECT decay_popularity($1)", ['movie']);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in addMovieRating:', err);
    res.status(500).json({ message: "Server error while adding/updating movie rating", error: err.message });
  } finally {
    client.release();
  }
};


export const addSeriesRating = async (req, res) => {
  const { user_id, series_id, rating, comments } = req.body;

  if (!user_id || !series_id || rating === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT * FROM series_review WHERE user_id = $1 AND series_id = $2`,
      [user_id, series_id]
    );

    let result;

    if (existing.rows.length > 0) {
      result = await client.query(
        `UPDATE series_review
         SET rating = $1, comments = $2, created_at = CURRENT_TIMESTAMP
         WHERE user_id = $3 AND series_id = $4
         RETURNING *`,
        [rating, comments || null, user_id, series_id]
      );
    } else {
      result = await client.query(
        `INSERT INTO series_review (user_id, series_id, rating, comments)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [user_id, series_id, rating, comments || null]
      );
    }

    // Popularity increment capped at 2 max for rating 10, proportional otherwise
    if (rating > 0) {
      const popularityIncrement = Math.min((rating / 10) * 2, 2);
      await client.query(
        `INSERT INTO series_popularity (series_id, popularity_score, last_updated)
         VALUES ($1, $2, NOW())
         ON CONFLICT (series_id) DO UPDATE
         SET popularity_score = series_popularity.popularity_score + EXCLUDED.popularity_score,
             last_updated = NOW()`,
        [series_id, popularityIncrement]
      );
    }


    await client.query("SELECT decay_popularity($1)", ['series']);

    await client.query('COMMIT');

    res.status(existing.rows.length > 0 ? 200 : 201).json({
      message: existing.rows.length > 0 ? "Series rating updated" : "Series rating added",
      review: result.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error adding/updating series rating:", err);
    res.status(500).json({ message: "Server error while adding/updating series rating" });
  } finally {
    client.release();
  }
};

export const getMovieRating = async (req, res) => {
  const { user_id, movie_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT rating FROM movie_review WHERE user_id = $1 AND movie_id = $2`,
      [user_id, movie_id]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ rating: result.rows[0].rating });
    } else {
      res.status(200).json({ rating: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching movie rating" });
  }
};

export const getSeriesRating = async (req, res) => {
  const { user_id, series_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT rating FROM series_review WHERE user_id = $1 AND series_id = $2`,
      [user_id, series_id]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ rating: result.rows[0].rating });
    } else {
      res.status(200).json({ rating: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching series rating" });
  }
};


export const getAllReviews = async (req, res) => {
  const { user_id } = req.params;
  const parsedUserId = parseInt(user_id, 10);

  if (isNaN(parsedUserId)) {
    return res.status(400).json({ error: "Invalid user_id" });
  }

  try {
    const query = `
      SELECT r.review_id, r.rating, r.comments, r.created_at,
             'movie' as type, m.movie_id, m.title, m.poster_url
      FROM movie_review r
      JOIN movie m ON r.movie_id = m.movie_id
      WHERE r.user_id = $1
      UNION
      SELECT r.review_id, r.rating, r.comments, r.created_at,
             'series' as type, s.series_id, s.title, s.poster_url
      FROM series_review r
      JOIN series s ON r.series_id = s.series_id
      WHERE r.user_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query, [parsedUserId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching ratings:", err);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
};
