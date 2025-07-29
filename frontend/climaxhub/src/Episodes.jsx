import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Episodes.css";

const Episodes = () => {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [userRatings, setUserRatings] = useState({}); // episode_id -> rating

const fetchEpisodes = async () => {
  const res = await fetch(`http://localhost:5000/api/series/${id}`);
  const data = await res.json();
  setSeries(data);

  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    const ratingsRes = await fetch(`http://localhost:5000/api/rating/episode/${user.user_id}/${id}`);
    const ratingsData = await ratingsRes.json();
    const ratingsMap = {};
    ratingsData.forEach(r => ratingsMap[r.episode_id] = r.rating);
    setUserRatings(ratingsMap);
  }
};

  useEffect(() => {
    fetchEpisodes();
  }, [id]);

  const handleRateEpisode = async (episodeId, rating) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login to rate episodes.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/rating/episode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          episode_id: episodeId,
          rating
        }),
      });
      if (!res.ok) throw new Error("Failed to rate episode");
      setUserRatings(prev => ({ ...prev, [episodeId]: rating }));
      alert("Episode rated!");
      await fetchEpisodes();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!series) return <div className="loader">Loading...</div>;

  const selected = series.seasons.find(s => s.season_number === selectedSeason);

  return (
    <div className="episodes-page">
      <div className="series-header">
        <img src={series.poster_url} alt={series.title} />
        <h1>{series.title}</h1>
      </div>
      <div className="season-selector">
        {series.seasons.map(s => (
          <button
            key={s.season_id}
            className={`season-btn ${selectedSeason === s.season_number ? "active" : ""}`}
            onClick={() => setSelectedSeason(s.season_number)}
          >
            {s.season_number}
          </button>
        ))}
      </div>
      <div className="episode-list">
        {selected && selected.episodes && selected.episodes.map(ep => (
          <div key={ep.episode_id} className="episode-line">
            <div>
              <strong>Episode {ep.episode_number}: {ep.title}</strong>
              {ep.air_date && <span className="episode-date"> ({new Date(ep.air_date).toLocaleDateString()})</span>}
              {ep.duration && <span className="episode-duration"> • {ep.duration} min</span>}
              {ep.avg_rating !== undefined && (
                <span className="episode-rating">
                  • {ep.avg_rating > 0 ? `⭐ ${ep.avg_rating}/5` : "To Be Rated"}
                </span>
              )}
              {ep.description && <p className="episode-desc">{ep.description}</p>}
            </div>
            <div className="episode-rate">
              {[...Array(5)].map((_, idx) => (
                <span
                  key={idx}
                  className={`episode-star ${userRatings[ep.episode_id] >= idx + 1 ? "active" : ""}`}
                  onClick={() => handleRateEpisode(ep.episode_id, idx + 1)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Episodes;
