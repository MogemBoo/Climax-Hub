export const getRecentlyViewed = async (req, res) => {
  const { user_id } = req.params;
  if (!user_id) return res.status(400).json({ error: "User ID is required" });

  try {
    const result = await pool.query(
      `
      SELECT rv.item_id, rv.item_type, rv.viewed_at,
             CASE 
               WHEN rv.item_type = 'movies' THEN m.title 
               WHEN rv.item_type = 'series' THEN s.title 
             END AS title,
             CASE 
               WHEN rv.item_type = 'movies' THEN m.poster_url
               WHEN rv.item_type = 'series' THEN s.poster_url
             END AS poster_url,
             CASE 
               WHEN rv.item_type = 'movies' THEN ROUND(m.rating::numeric,1)
               WHEN rv.item_type = 'series' THEN ROUND(s.rating::numeric,1)
             END AS rating,
             CASE 
               WHEN rv.item_type = 'movies' THEN m.release_date
               WHEN rv.item_type = 'series' THEN s.start_date
             END AS release_date
      FROM recently_viewed rv
      LEFT JOIN movie m ON rv.item_type = 'movies' AND rv.item_id = m.movie_id
      LEFT JOIN series s ON rv.item_type = 'series' AND rv.item_id = s.series_id
      WHERE rv.user_id = $1
      ORDER BY rv.viewed_at DESC
      LIMIT 20
      `,
      [user_id]
    );

    const viewed = result.rows.map((item) => {
      let formattedDate = null;
      if (item.release_date) {
        const date = new Date(item.release_date);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        formattedDate = `${day}-${month}-${year}`;
      }
      return {
        ...item,
        release_date: formattedDate,
        type: item.item_type, // send type directly
      };
    });

    res.json(viewed);
  } catch (err) {
    console.error("Error fetching recently viewed:", err);
    res.status(500).json({ error: "Failed to fetch recently viewed" });
  }
};