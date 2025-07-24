import pool from "../db.js";

export const addMovieRating = async (req, res) => {
    const { user_id, movie_id, rating, comments } = req.body;

    console.log('addMovieRating called with:', { user_id, movie_id, rating, comments });

    if (!user_id || !movie_id || !rating) {
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

        if (rating >= 7) {
            await client.query(
                `INSERT INTO movie_popularity (movie_id, popularity, last_updated)
                 VALUES ($1, 1.0, NOW())
                 ON CONFLICT (movie_id) DO UPDATE
                 SET popularity = movie_popularity.popularity + 1.0,
                     last_updated = NOW()`,
                [movie_id]
            );
        }

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

    if (!user_id || !series_id || !rating) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const check = await pool.query(
            `SELECT * FROM series_review WHERE user_id = $1 AND series_id = $2`,
            [user_id, series_id]
        );

        let result;

        if (check.rows.length > 0) {
            result = await pool.query(
                `UPDATE series_review
         SET rating = $1, comments = $2, created_at = CURRENT_TIMESTAMP
         WHERE user_id = $3 AND series_id = $4
         RETURNING *`,
                [rating, comments || null, user_id, series_id]
            );
            res.status(200).json({ message: "Series rating updated", review: result.rows[0] });
        } else {
            result = await pool.query(
                `INSERT INTO series_review (user_id, series_id, rating, comments)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [user_id, series_id, rating, comments || null]
            );
            res.status(201).json({ message: "Series rating added", review: result.rows[0] });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while adding/updating series rating" });
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