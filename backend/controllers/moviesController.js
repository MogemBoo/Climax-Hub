import pool from '../db.js';

//add movie
export async function addFullMovie(req, res) {
  const {
    title, release_date, duration, description,
    rating, vote_count, poster_url, trailer_url,
    genres, cast, crew
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // insrrt movie
    const movieResult = await client.query(`
      INSERT INTO movie (title, release_date, duration, description, rating, vote_count, poster_url, trailer_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING movie_id
    `, [title, release_date, duration, description, rating, vote_count, poster_url, trailer_url]);

    const movieId = movieResult.rows[0].movie_id;

    // Incert genres
    for (const genreName of genres || []) {
      let genreRes = await client.query(`SELECT genre_id FROM genre WHERE name=$1`, [genreName]);
      let genreId;

      if (genreRes.rowCount === 0) {
        genreRes = await client.query(`INSERT INTO genre(name) VALUES($1) RETURNING genre_id`, [genreName]);
      }
      genreId = genreRes.rows[0].genre_id;

      await client.query(`INSERT INTO movie_genre(movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [movieId, genreId]);
    }

    // Insert cast
    for (const person of cast || []) {
      const { name, birthdate, bio, profile_img_url, popularity, character_name } = person;

      let personRes = await client.query(`SELECT person_id FROM person WHERE name=$1`, [name]);
      let personId;

      if (personRes.rowCount === 0) {
        personRes = await client.query(`
          INSERT INTO person(name, birthdate, bio, profile_img_url, popularity)
          VALUES($1, $2, $3, $4, $5) RETURNING person_id
        `, [name, birthdate, bio, profile_img_url, popularity]);
      }
      personId = personRes.rows[0].person_id;

      await client.query(`
        INSERT INTO movie_cast(movie_id, person_id, character_name)
        VALUES($1, $2, $3) ON CONFLICT DO NOTHING
      `, [movieId, personId, character_name]);
    }

    // Insert crew
    for (const person of crew || []) {
      const { name, birthdate, bio, profile_img_url, popularity, role } = person;

      let personRes = await client.query(`SELECT person_id FROM person WHERE name=$1`, [name]);
      let personId;

      if (personRes.rowCount === 0) {
        personRes = await client.query(`
          INSERT INTO person(name, birthdate, bio, profile_img_url, popularity)
          VALUES($1, $2, $3, $4, $5) RETURNING person_id
        `, [name, birthdate, bio, profile_img_url, popularity]);
      }
      personId = personRes.rows[0].person_id;

      await client.query(`
        INSERT INTO movie_crew(movie_id, person_id, role)
        VALUES($1, $2, $3) ON CONFLICT DO NOTHING
      `, [movieId, personId, role]);
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Movie, cast, crew, and genres added!', movie_id: movieId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(' Insert error:', err);
    res.status(500).json({ error: 'Failed to insert movie data' });
  } finally {
    client.release();
  }
}

//fetch by id
export async function getMovieById(req, res) {
  const movieId = req.params.id;

  try {
    const movieResult = await pool.query(`
      SELECT movie_id, title, release_date, duration, description, ROUND(rating::numeric,1) AS rating, vote_count, poster_url, trailer_url
      FROM movie
      WHERE movie_id = $1
    `, [movieId]);

    if (movieResult.rowCount === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const movie = movieResult.rows[0];

    const genresResult = await pool.query(`
      SELECT g.name FROM genre g
      JOIN movie_genre mg ON g.genre_id = mg.genre_id
      WHERE mg.movie_id = $1
    `, [movieId]);

    const castResult = await pool.query(`
      SELECT p.person_id, p.name, p.birthdate, p.bio, p.profile_img_url, p.popularity, mc.character_name
      FROM person p
      JOIN movie_cast mc ON p.person_id = mc.person_id
      WHERE mc.movie_id = $1
    `, [movieId]);

    const crewResult = await pool.query(`
      SELECT p.person_id, p.name, p.birthdate, p.bio, p.profile_img_url, p.popularity, mc.role
      FROM person p
      JOIN movie_crew mc ON p.person_id = mc.person_id
      WHERE mc.movie_id = $1
    `, [movieId]);

    const reviewsResult = await pool.query(`
      SELECT mr.review_id, mr.user_id, u.username, ROUND(mr.rating::numeric,1) AS rating, mr.comments, mr.created_at
      FROM movie_review mr
      JOIN users u ON mr.user_id = u.user_id
      WHERE mr.movie_id = $1
      ORDER BY mr.created_at DESC
    `, [movieId]);

    res.json({
      ...movie,
      genres: genresResult.rows.map(g => g.name),
      cast: castResult.rows,
      crew: crewResult.rows,
      reviews: reviewsResult.rows
    });
  } catch (error) {
    console.error('Error fetching movie by ID:', error);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
}

//fetch top 20 movies
export async function getTopRatedMovies(req, res) {
  try {
    const result = await pool.query(`
      SELECT movie_id, title, ROUND(rating::numeric,1) AS rating, vote_count, poster_url, description
      FROM movie
      WHERE rating IS NOT NULL
      ORDER BY rating DESC, vote_count DESC
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(' Error fetching top-rated movies:', error);
    res.status(500).json({ error: 'Failed to fetch top-rated movies' });
  }
}

// Search movies by title
export async function searchMovies(req, res) {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Search query is required' });

  try {
    const result = await pool.query(`
      SELECT movie_id, title, ROUND(rating::numeric,1) AS rating, release_date, poster_url
      FROM movie
      WHERE LOWER(title) LIKE LOWER($1)
      ORDER BY release_date DESC
      LIMIT 20
    `, [`%${query}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error(' Error searching movies:', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
}

// Get recently released movies
export async function getRecentMovies(req, res) {
  try {
    const result = await pool.query(`
      SELECT movie_id, title, release_date, ROUND(rating::numeric,1) AS rating, poster_url
      FROM movie
      ORDER BY release_date DESC
      LIMIT 20
    `);

    // Format release_date as dd-mm-yyyy
    const movies = result.rows.map(movie => {
      const date = new Date(movie.release_date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
      const year = date.getFullYear();

      return {
        ...movie,
        release_date: `${day}-${month}-${year}`
      };
    });

    res.json(movies);
  } catch (error) {
    console.error('Error fetching recent movies:', error);
    res.status(500).json({ error: 'Failed to fetch recent movies' });
  }
}


// Get all movies
export async function getAllMovies(req, res) {
  try {
    const result = await pool.query(`
      SELECT movie_id, title, release_date, ROUND(rating::numeric,1) AS rating, poster_url, description
      FROM movie
      ORDER BY title DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(' Error fetching all movies:', error);
    res.status(500).json({ error: 'Failed to fetch all movies' });
  }
}

// per star user count
export const getPerStarUserCount = async (req, res) => {
  const { id } = req.params;

  const movie_id = parseInt(id);
  if (isNaN(movie_id)) {
    return res.status(400).json({ error: 'Invalid movie ID' });
  }

  try {
    const result = await pool.query(`
      SELECT rating, COUNT(DISTINCT user_id) AS count
      FROM movie_review
      WHERE movie_id = $1
      GROUP BY rating
      ORDER BY rating ASC
    `, [movie_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error while fetching per star user count:', error);
    res.status(500).json({ error: 'Failed to fetch per star user count' });
  }
}

// Get all reviews for a movie with a specific rating
export const getReviewsByRating = async (req, res) => {
  const { id, rating } = req.params;

  const movie_id = parseInt(id);
  const star_rating = parseInt(rating);

  if (isNaN(movie_id) || isNaN(star_rating)) {
    return res.status(400).json({ error: 'Invalid movie ID or rating' });
  }

  try {
    const result = await pool.query(`
      SELECT mr.review_id, mr.user_id, u.username, ROUND(mr.rating::numeric,1) AS rating, mr.comments, mr.created_at
      FROM movie_review mr
      JOIN users u ON mr.user_id = u.user_id
      WHERE mr.movie_id = $1 AND mr.rating = $2
      ORDER BY mr.created_at DESC
    `, [movie_id, star_rating]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews by rating:', error);
    res.status(500).json({ error: 'Failed to fetch reviews by rating' });
  }
}
