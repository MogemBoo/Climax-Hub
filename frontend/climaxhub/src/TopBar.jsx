import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TopBar.css"; // reuse your existing styles

const TopBar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const debounceTimer = useRef(null);
  const searchInputRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setShowUserDropdown(false);
    navigate("/");
  };

  // Fetch both movies & series with debounce
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (searchQuery.trim() === "") {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const [moviesRes, seriesRes] = await Promise.all([
          fetch(`http://localhost:5000/api/movies/search?query=${encodeURIComponent(searchQuery)}`),
          fetch(`http://localhost:5000/api/series/search?query=${encodeURIComponent(searchQuery)}`)
        ]);

        const movies = await moviesRes.json();
        const series = await seriesRes.json();

        // Merge and label results
        const combined = [
          ...(movies || []).map((m) => ({ ...m, type: "movie" })),
          ...(series || []).map((s) => ({ ...s, type: "series" }))
        ];

        setSearchResults(combined);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error("Error searching:", err);
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  useEffect(() => {
    const handleUserUpdate = () => {
      const saved = localStorage.getItem("user");
      setUser(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target) &&
        !e.target.closest(".search-suggestions-dropdown") &&
        !e.target.closest(".user-dropdown") &&
        !e.target.closest(".user-menu-wrapper")
      ) {
        setShowSearchDropdown(false);
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return;
    setShowSearchDropdown(false);
    navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
  };

  // Navigate based on type
  const handleSuggestionClick = (id, type) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/details/${type === "movie" ? "movies" : "series"}/${id}`);
  };

  return (
    <div className="top-bar">
      <div className="right-controls">
        <button type="button" className="top-series-btn" onClick={() => navigate("/top-series")}>
          Top Series
        </button>
        <button type="button" className="top-movies-btn" onClick={() => navigate("/top-movies")}>
          Top Movies
        </button>

        {!user ? (
          <button type="button" className="login-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        ) : (
          <div className="user-menu-wrapper">
            <button
              type="button"
              className="login-btn user-btn"
              onClick={() => setShowUserDropdown((prev) => !prev)}
            >
              {user.username}
            </button>
            {showUserDropdown && (
              <div className="user-dropdown">
                <button className="dropdown-item" onClick={() => { setShowUserDropdown(false); navigate("/your-profile"); }}>
                  Your Profile
                </button>
                <button className="dropdown-item" onClick={() => { setShowUserDropdown(false); navigate("/your-watchlist"); }}>
                  Your Watchlist
                </button>
                <button className="dropdown-item" onClick={() => { setShowUserDropdown(false); navigate("/your-ratings"); }}>
                  Your Ratings
                </button>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} className="center-search-form" ref={searchInputRef} style={{ position: "relative" }}>
        {user && user.is_admin && (
          <button type="button" className="admin-btn" onClick={() => navigate("/admin")} style={{ marginRight: "0.5rem" }}>
            Admin
          </button>
        )}
        <button type="button" className="community-btn" onClick={() => navigate("/community")} style={{ marginRight: "0.5rem" }}>
          Community
        </button>
        <input
          type="text"
          placeholder="Search Movies and Series..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          autoComplete="off"
          onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
        />
        <button type="submit" className="search-button">
          Search
        </button>

        {showSearchDropdown && searchResults.length > 0 && (
          <div className="search-suggestions-dropdown">
            {searchResults.map((item) => (
              <div
                key={item.movie_id || item.series_id}
                className="search-suggestion-card"
                onClick={() => handleSuggestionClick(item.movie_id || item.series_id, item.type)}
              >
                <img src={item.poster_url} alt={item.title} className="suggestion-poster" />
                <div className="suggestion-info">
                  <p className="suggestion-title">{item.title}</p>
                  <p className="suggestion-subinfo">
                    {item.type === "movie" ? "🎬 Movie" : "📺 Series"} • Rating: {item.rating}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default TopBar;
