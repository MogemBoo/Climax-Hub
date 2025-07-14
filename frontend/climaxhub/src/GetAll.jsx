import React, { useEffect, useState } from "react";
import "./GetAll.css";

const GetAll = () => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/movies/all")
      .then((res) => res.json())
      .then((data) => setMovies(data))
      .catch((err) => console.error("Error fetching all movies:", err));
  }, []);

  return (
    <div className="getall-container">
      <h1 className="getall-title"> All Movies</h1>
      <div className="movie-grid">
        {movies.map((movie) => (
          <div key={movie.movie_id} className="movie-card">
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="movie-poster"
            />
            <h3 className="movie-title">{movie.title}</h3>
            <p className="movie-info">Rating:  {movie.rating}</p>
            <p className="movie-info">Released: {movie.release_date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GetAll;
