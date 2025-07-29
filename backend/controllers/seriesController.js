import pool from '../db.js';
import { getOrCreateGenre } from '../utils/helpers.js';

export async function addFullSeries(req, res) {
  const {
    title,
    start_date,
    end_date,
    description,
    rating,
    vote_count,
    poster_url,
    trailer_url,
    genres,
    cast,
    crew,
    seasons
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert series
    const seriesResult = await client.query(`
      INSERT INTO series (title, start_date, end_date, description, rating, vote_count, poster_url, trailer_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING series_id
    `, [title, start_date, end_date, description, rating, vote_count, poster_url, trailer_url]);

    const seriesId = seriesResult.rows[0].series_id;

    // Insert genres
    for (const genreName of genres || []) {
      const genreId = await getOrCreateGenre(client, genreName);
      await client.query(
        `INSERT INTO series_genre(series_id, genre_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
        [seriesId, genreId]
      );
    }

    // Insert cast
    for (const person of cast || []) {
      const { name, birthdate, bio, profile_img_url, popularity, character_name } = person;
      let personRes = await client.query(`SELECT person_id FROM person WHERE name=$1`, [name]);
      if (personRes.rowCount === 0) {
        personRes = await client.query(`
          INSERT INTO person(name, birthdate, bio, profile_img_url, popularity)
          VALUES($1, $2, $3, $4, $5) RETURNING person_id
        `, [name, birthdate, bio, profile_img_url, popularity]);
      }
      const personId = personRes.rows[0].person_id;
      await client.query(`
        INSERT INTO series_cast(series_id, person_id, character_name)
        VALUES($1, $2, $3) ON CONFLICT DO NOTHING
      `, [seriesId, personId, character_name]);
    }

    // Insert crew
    for (const person of crew || []) {
      const { name, birthdate, bio, profile_img_url, popularity, role } = person;
      let personRes = await client.query(`SELECT person_id FROM person WHERE name=$1`, [name]);
      if (personRes.rowCount === 0) {
        personRes = await client.query(`
          INSERT INTO person(name, birthdate, bio, profile_img_url, popularity)
          VALUES($1, $2, $3, $4, $5) RETURNING person_id
        `, [name, birthdate, bio, profile_img_url, popularity]);
      }
      const personId = personRes.rows[0].person_id;
      await client.query(`
        INSERT INTO series_crew(series_id, person_id, role)
        VALUES($1, $2, $3) ON CONFLICT DO NOTHING
      `, [seriesId, personId, role]);
    }

    // Insert seasons and episodes
    for (const season of seasons || []) {
      const { season_number, release_date, description, trailer_url, episodes } = season;

      const seasonResult = await client.query(`
        INSERT INTO season (series_id, season_number, release_date, description, trailer_url)
        VALUES ($1, $2, $3, $4, $5) RETURNING season_id
      `, [seriesId, season_number, release_date, description, trailer_url]);

      const seasonId = seasonResult.rows[0].season_id;

      for (const ep of episodes || []) {
        const { episode_number, title, air_date, duration, description } = ep;
        await client.query(`
          INSERT INTO episode (season_id, episode_number, title, air_date, duration, description)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [seasonId, episode_number, title, air_date, duration, description]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: ' Series, cast, crew, genres, seasons, and episodes added!', series_id: seriesId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(' Insert error:', err);
    res.status(500).json({ error: 'Failed to insert series data' });
  } finally {
    client.release();
  }
}

export async function getSeriesById(req, res) {
  const seriesId = req.params.id;

  try {
    const seriesResult = await pool.query(`
      SELECT series_id, title, start_date, end_date, description, ROUND(rating::numeric,1) AS rating, vote_count, poster_url, trailer_url
      FROM series
      WHERE series_id = $1
    `, [seriesId]);

    if (seriesResult.rowCount === 0) {
      return res.status(404).json({ error: 'Series not found' });
    }

    const series = seriesResult.rows[0];

    const genresResult = await pool.query(`
      SELECT g.name FROM genre g
      JOIN series_genre sg ON g.genre_id = sg.genre_id
      WHERE sg.series_id = $1
    `, [seriesId]);

    const castResult = await pool.query(`
      SELECT p.person_id, p.name, p.birthdate, p.bio, p.profile_img_url, p.popularity, sc.character_name
      FROM person p
      JOIN series_cast sc ON p.person_id = sc.person_id
      WHERE sc.series_id = $1
    `, [seriesId]);

    const crewResult = await pool.query(`
      SELECT p.person_id, p.name, p.birthdate, p.bio, p.profile_img_url, p.popularity, sc.role
      FROM person p
      JOIN series_crew sc ON p.person_id = sc.person_id
      WHERE sc.series_id = $1
    `, [seriesId]);

    const seasonsResult = await pool.query(`
      SELECT season_id, season_number, release_date, description, trailer_url
      FROM season
      WHERE series_id = $1
      ORDER BY season_number
    `, [seriesId]);

    for (const season of seasonsResult.rows) {
      const episodesResult = await pool.query(`
        SELECT episode_id, episode_number, title, air_date, duration, description
        FROM episode
        WHERE season_id = $1
        ORDER BY episode_number
      `, [season.season_id]);

      season.episodes = episodesResult.rows;
    }

    const reviewsResult = await pool.query(`
  SELECT r.review_id, ROUND(r.rating::numeric,1) AS rating, r.comments, r.created_at, p.username
  FROM series_review r
  JOIN users p ON r.user_id = p.user_id
  WHERE r.series_id = $1
  ORDER BY r.created_at DESC
`, [seriesId]);

    await pool.query(`
  INSERT INTO series_popularity (series_id, popularity_score, last_updated)
  VALUES ($1, 0.5, NOW())
  ON CONFLICT (series_id) DO UPDATE
  SET popularity_score = series_popularity.popularity_score + 0.75,
      last_updated = NOW()
`, [seriesId]);

    await pool.query("SELECT decay_popularity($1)", ['series']);

    res.json({
      ...series,
      genres: genresResult.rows.map(g => g.name),
      cast: castResult.rows,
      crew: crewResult.rows,
      seasons: seasonsResult.rows,
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching series by ID:', error);
    res.status(500).json({ error: 'Failed to fetch series details' });
  }
}


//top rated
export async function getTopRatedSeries(req, res) {
  try {
    const result = await pool.query(`
      SELECT series_id, title, ROUND(rating::numeric,1) AS rating, vote_count, poster_url, description
      FROM series
      WHERE rating IS NOT NULL
      ORDER BY rating DESC, vote_count DESC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching top-rated series:', error);
    res.status(500).json({ error: 'Failed to fetch top-rated series' });
  }
}


// search
export async function searchSeries(req, res) {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Search query is required' });

  try {
    const result = await pool.query(`
      SELECT series_id, title, ROUND(rating::numeric,1) AS rating, start_date, poster_url,
       similarity(title, $1) AS sim
FROM series
WHERE LOWER(title) LIKE LOWER('%' || $1 || '%')
ORDER BY sim DESC
LIMIT 20;
    `, [`%${query}%`]);

    for (const series of result.rows) {
      const weight = series.sim * 0.5;
      if (weight > 0.1) {
        await pool.query(`
      INSERT INTO series_popularity (series_id, popularity_score, last_updated)
      VALUES ($1, $2, NOW())
      ON CONFLICT (series_id) DO UPDATE
      SET popularity_score = series_popularity.popularity_score + $2,
          last_updated = NOW()
    `, [series.series_id, weight]);
      }
    }

    await pool.query("SELECT decay_popularity($1)", ['series']);

    res.json(result.rows);
  } catch (error) {
    console.error(' Error searching series:', error);
    res.status(500).json({ error: 'Failed to search series' });
  }
}


export async function getRecentSeries(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        series_id, 
        title, 
        TO_CHAR(start_date, 'DD-MM-YYYY') AS start_date, 
        ROUND(rating::numeric,1) AS rating, 
        poster_url
      FROM series
      ORDER BY start_date DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recent series:', error);
    res.status(500).json({ error: 'Failed to fetch recent series' });
  }
}


//get all
export async function getAllSeries(req, res) {
  try {
    const result = await pool.query(`
      SELECT series_id, title, start_date, ROUND(rating::numeric,1) AS rating, poster_url
      FROM series
      ORDER BY title DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(' Error fetching all series:', error);
    res.status(500).json({ error: 'Failed to fetch all series' });
  }
}

export async function getSeriesEpisodes(req, res) {
  const seriesId = req.params.id;

  try {
    // Get all seasons for the series
    const seasonsResult = await pool.query(`
      SELECT season_id, season_number
      FROM season
      WHERE series_id = $1
      ORDER BY season_number
    `, [seriesId]);

    // For each season, get episodes
    const episodesBySeason = {};

    for (const season of seasonsResult.rows) {
      const episodesResult = await pool.query(`
        SELECT episode_id, episode_number, title, air_date, duration, description
        FROM episode
        WHERE season_id = $1
        ORDER BY episode_number
      `, [season.season_id]);

      episodesBySeason[season.season_number] = episodesResult.rows;
    }

    // Flatten episodes into one array with a 'season' field for frontend convenience
    const allEpisodes = [];
    for (const [seasonNum, episodes] of Object.entries(episodesBySeason)) {
      episodes.forEach(ep => ep.season = parseInt(seasonNum));
      allEpisodes.push(...episodes);
    }

    res.json(allEpisodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
}

// per star user count
export const getPerStarUserCount = async (req, res) => {
  const { id } = req.params;

  const series_id = parseInt(id);
  if (isNaN(series_id)) {
    return res.status(400).json({ error: 'Invalid series ID' });
  }

  try {
    const result = await pool.query(`
      SELECT rating, COUNT(DISTINCT user_id) AS count
      FROM series_review
      WHERE series_id = $1
      GROUP BY rating
      ORDER BY rating ASC
    `, [series_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error while fetching per star user count:', error);
    res.status(500).json({ error: 'Failed to fetch per star user count' });
  }
}

// get reviews by rating
export const getReviewsByRating = async (req, res) => {
  const { id, rating } = req.params;

  const series_id = parseInt(id);
  const star_rating = parseInt(rating);

  if (isNaN(series_id) || isNaN(star_rating)) {
    return res.status(400).json({ error: 'Invalid series ID or rating' });
  }

  try {
    const result = await pool.query(`
      SELECT sr.review_id, sr.user_id, u.username, ROUND(sr.rating::numeric,1) AS rating, sr.comments, sr.created_at
      FROM series_review sr
      JOIN users u ON sr.user_id = u.user_id
      WHERE sr.series_id = $1 AND sr.rating = $2
      ORDER BY sr.created_at DESC
    `, [series_id, star_rating]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching series reviews by rating:', error);
    res.status(500).json({ error: 'Failed to fetch series reviews by rating' });
  }
}

//get trending series
export async function getTrendingSeries(req, res) {
  try {
    const result = await pool.query(`
      SELECT s.series_id, s.title, ROUND(s.rating::numeric,1) AS rating, s.vote_count,
      s.poster_url, s.description, TO_CHAR(s.start_date, 'DD-MM-YYYY') AS start_date
      FROM series_popularity sp
      JOIN series s ON sp.series_id = s.series_id
      WHERE sp.last_updated >= NOW() - INTERVAL '1 day'
      ORDER BY sp.popularity_score DESC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trending series:', error);
    res.status(500).json({ error: 'Failed to fetch trending series' });
  }
}

//get series by genre
export async function getSeriesByGenre(req, res) {
  const { genre } = req.params;

  try {
    const result = await pool.query(`
      SELECT s.series_id, s.title, ROUND(s.rating::numeric,1) AS rating, s.vote_count,
      s.poster_url, s.description, TO_CHAR(s.start_date, 'DD-MM-YYYY') AS start_date
      FROM series s
      JOIN series_genre sg ON s.series_id = sg.series_id
      JOIN genre g ON sg.genre_id = g.genre_id
      WHERE LOWER(g.name) = LOWER($1)
      ORDER BY s.start_date DESC
    `, [genre]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching series by genre:', error);
    res.status(500).json({ error: 'Failed to fetch series by genre' });
  }
}