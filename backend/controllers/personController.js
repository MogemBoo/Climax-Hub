import pool from "../db.js";

export const getPersonWithWorks = async (req, res) => {
  try {
    const { person_id } = req.params;

    if (!person_id) {
      return res.status(400).json({ message: "Person ID is required." });
    }

    // Fetch person info
    const personResult = await pool.query(
      `SELECT * FROM person WHERE person_id = $1`,
      [person_id]
    );

    if (personResult.rows.length === 0) {
      return res.status(404).json({ message: "Person not found." });
    }

    const person = personResult.rows[0];

    // Fetch movie works
    const moviesResult = await pool.query(
      `
      SELECT 
        m.movie_id AS work_id,
        m.title,
        m.release_date AS date,
        m.poster_url,
        'movie' AS type,
        c.role
      FROM crew c
      JOIN movie m ON c.movie_id = m.movie_id
      WHERE c.person_id = $1
      `,
      [person_id]
    );

    // Fetch series works
    const seriesResult = await pool.query(
      `
      SELECT 
        s.series_id AS work_id,
        s.title,
        s.start_date AS date,
        s.poster_url,
        'series' AS type,
        c.role
      FROM crew c
      JOIN series s ON c.series_id = s.series_id
      WHERE c.person_id = $1
      `,
      [person_id]
    );

    // Combine and sort by date (newest first)
    const allWorks = [...moviesResult.rows, ...seriesResult.rows].sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateB - dateA;
    });

    person.works = allWorks;

    res.json(person);
  } catch (err) {
    console.error("Error fetching person with works:", err);
    res.status(500).json({ message: "Failed to fetch person details." });
  }
};
