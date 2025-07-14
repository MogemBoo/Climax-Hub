import pool from "../db.js";

export const getUserRecommendations = async (req, res) => {
    const user_id = req.params.user_id;

    try {
        // Fetch recommended movies
        const movieRecs = await pool.query(
            `SELECT DISTINCT ON (rm.recommended_movie_id) 
     rm.user_id,
     rm.movie_id,
     rm.recommended_movie_id,
     m.title,
     m.poster_url,
     ROUND(m.rating::numeric,1) AS rating,
     m.release_date
   FROM recommendation_movie rm
   JOIN movie m ON rm.recommended_movie_id = m.movie_id
   WHERE rm.user_id = $1
   ORDER BY rm.recommended_movie_id, m.rating DESC NULLS LAST`,
            [user_id]
        );

        // Fetch recommended series
        const seriesRecs = await pool.query(
            `SELECT DISTINCT ON (rs.recommended_series_id)
         rs.user_id,
         rs.series_id,
         rs.recommended_series_id,
         s.title,
         s.poster_url,
         ROUND(s.rating::numeric,1) AS rating,
         s.start_date
       FROM recommendation_series rs
       JOIN series s ON rs.recommended_series_id = s.series_id
       WHERE rs.user_id = $1
       ORDER BY rs.recommended_series_id, s.rating DESC NULLS LAST`,
            [user_id]
        );

        res.json({
            movies: movieRecs.rows,
            series: seriesRecs.rows,
        });

    } catch (err) {
        console.error("Error fetching recommendations:", err);
        res.status(500).json({ message: "Error loading recommendations" });
    }
};
