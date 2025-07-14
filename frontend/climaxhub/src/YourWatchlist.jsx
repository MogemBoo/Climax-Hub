import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./YourWatchlist.css";

const YourWatchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/login");
      return;
    }

    fetch(`http://localhost:5000/api/watchlist/${user.user_id}`)
      .then((res) => res.json())
      .then((data) => setWatchlist(data || []))
      .catch((err) => {
        console.error("Failed to fetch watchlist:", err);
        setWatchlist([]);
      });
  }, [navigate]);

  return (
    <div className="watchlist-container">
      <h1 className="watchlist-title">Your Watchlist</h1>
      {watchlist.length === 0 ? (
        <p className="watchlist-empty">Your watchlist is empty.</p>
      ) : (
        <div className="watchlist-grid">
          {watchlist.map((item) => {
            const id = item.type === "movie" ? item.movie_id : item.series_id;
            const url = item.type === "movie" ? `/details/movies/${id}` : `/details/series/${id}`;
            return (
              <div
                key={`${item.type}-${id}`}
                className="watchlist-card"
                onClick={() => navigate(url)}
              >
                <img
                  src={item.poster_url}
                  alt={item.title}
                  className="watchlist-poster"
                  onError={(e) => { e.target.src = "/fallback.jpg"; }}
                />
                <div className="watchlist-info">
                  <h3>{item.title}</h3>
                  <p>Status: {item.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default YourWatchlist;
