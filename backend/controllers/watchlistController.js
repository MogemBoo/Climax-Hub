import pool from "../db.js";

export const getUserWatchlist = async (req, res) => {
  const user_id = req.params.user_id;

  try {
    const movieWatchlist = await pool.query(
      `SELECT 
         m.movie_id,
         m.title,
         m.poster_url,
         m.rating,
         m.release_date,
         wm.status,
         'movie' as type
       FROM watchlist_movie wm
       JOIN movie m ON wm.movie_id = m.movie_id
       JOIN watchlist w ON wm.watchlist_id = w.watchlist_id
       WHERE w.user_id = $1`,
      [user_id]
    );

    const seriesWatchlist = await pool.query(
      `SELECT 
         s.series_id,
         s.title,
         s.poster_url,
         s.rating,
         s.start_date as release_date,
         ws.status,
         'series' as type
       FROM watchlist_series ws
       JOIN series s ON ws.series_id = s.series_id
       JOIN watchlist w ON ws.watchlist_id = w.watchlist_id
       WHERE w.user_id = $1`,
      [user_id]
    );

    const allWatchlist = [...movieWatchlist.rows, ...seriesWatchlist.rows];

    res.json(allWatchlist);

  } catch (err) {
    console.error("Error fetching watchlist:", err);
    res.status(500).json({ message: "Error loading watchlist" });
  }
};

export async function addToWatchlist(req, res) {
  const { user_id, movie_id, series_id, status = "to-watch" } = req.body;

  if (!user_id || (!movie_id && !series_id)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get user's watchlist_id
    const wlRes = await client.query(`
      SELECT watchlist_id FROM watchlist WHERE user_id = $1
    `, [user_id]);

    let watchlistId;
    if (wlRes.rowCount === 0) {
      // Create watchlist if not exists
      const insertWlRes = await client.query(`
        INSERT INTO watchlist (user_id) VALUES ($1) RETURNING watchlist_id
      `, [user_id]);
      watchlistId = insertWlRes.rows[0].watchlist_id;
    } else {
      watchlistId = wlRes.rows[0].watchlist_id;
    }

    if (movie_id) {
      await client.query(`
        INSERT INTO watchlist_movie (watchlist_id, movie_id, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (watchlist_id, movie_id) DO NOTHING
      `, [watchlistId, movie_id, status]);
    }

    if (series_id) {
      await client.query(`
        INSERT INTO watchlist_series (watchlist_id, series_id, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (watchlist_id, series_id) DO NOTHING
      `, [watchlistId, series_id, status]);
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Added to watchlist!" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Watchlist insert error:", err);
    res.status(500).json({ error: "Failed to add to watchlist" });
  } finally {
    client.release();
  }
}
