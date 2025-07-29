import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SearchResult.css";

const SearchResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract query from URL
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get("query") || "";

  useEffect(() => {
    if (!searchQuery) return;

    setLoading(true);

    Promise.all([
      fetch(`http://localhost:5000/api/movies/search?query=${encodeURIComponent(searchQuery)}`),
      fetch(`http://localhost:5000/api/series/search?query=${encodeURIComponent(searchQuery)}`)
    ])
      .then(async ([moviesRes, seriesRes]) => {
        const movies = await moviesRes.json();
        const series = await seriesRes.json();
        const combined = [
          ...(movies || []).map((m) => ({ ...m, type: "movie" })),
          ...(series || []).map((s) => ({ ...s, type: "series" }))
        ];
        setResults(combined);
      })
      .catch((err) => console.error("Error fetching search results:", err))
      .finally(() => setLoading(false));
  }, [searchQuery]);

  const handleCardClick = (item) => {
    navigate(`/details/${item.type === "movie" ? "movies" : "series"}/${item.movie_id || item.series_id}`);
  };

  return (
    <div className="search-results-container">
      <h1 className="search-results-title">
        Search Results for: <span>{searchQuery}</span>
      </h1>

      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : results.length === 0 ? (
        <p className="no-results-text">No results found.</p>
      ) : (
        <div className="results-grid">
          {results.map((item) => (
            <div
              key={item.movie_id || item.series_id}
              className="result-card"
              onClick={() => handleCardClick(item)}
            >
              <img
                src={item.poster_url}
                alt={item.title}
                className="result-poster"
              />
              <div className="result-info">
                <h3>{item.title}</h3>
                <p>{item.type === "movie" ? "🎬 Movie" : "📺 Series"} • Rating: {item.rating}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResult;
