import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TopMovies.css";

const TopSeries = () => {
  const [series, setSeries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/series/top")
      .then((res) => res.json())
      .then((data) => setSeries(data))
      .catch((err) => console.error("Error fetching top series:", err));
  }, []);

  return (
    <div className="topmovies-container">
      <h1 className="topmovies-title">Top Rated Series</h1>
      <div className="topmovies-list">
        {series.map((s) => (
          <div
            key={s.series_id}
            className="topmovie-item clickable"
            onClick={() => navigate(`/details/series/${s.series_id}`)}
          >
            <div className="topmovie-poster-container">
              <img
                src={s.poster_url}
                alt={s.title}
                className="topmovie-poster"
              />
              <div className="topmovie-rating">{s.rating}</div>
            </div>
            <div className="topmovie-description">
              <h2 className="topmovie-title">{s.title}</h2>
              <p className="topmovie-text">{s.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSeries; 