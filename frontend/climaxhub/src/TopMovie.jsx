import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ import navigate
import "./TopMovies.css";

const TopMovies = () => {
  const [movies, setMovies] = useState([]);
  const navigate = useNavigate(); // ✅ for redirect

  useEffect(() => {
    fetch("http://localhost:5000/api/movies/top")
      .then((res) => res.json())
      .then((data) => setMovies(data))
      .catch((err) => console.error("Error fetching top movies:", err));
  }, []);

  return (
    <div className="topmovies-container">
      <h1 className="topmovies-title">Top Rated Movies</h1>
      <div className="topmovies-list">
        {movies.map((movie) => (
          <div
            key={movie.movie_id}
            className="topmovie-item clickable"
            onClick={() => navigate(`/movies/${movie.movie_id}`)} // ✅ navigate to details
          >
            <div className="topmovie-poster-container">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="topmovie-poster"
              />
              <div className="topmovie-rating">{movie.rating}</div>
            </div>
            <div className="topmovie-description">
              <h2 className="topmovie-title">{movie.title}</h2>
              <p className="topmovie-text">{movie.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopMovies;
