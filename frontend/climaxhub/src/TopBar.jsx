import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TopBar.css"; // reuse your existing styles

const TopBar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // Separate states for user menu and search suggestions dropdowns
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

  // Fetch search suggestions with debounce
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (searchQuery.trim() === "") {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      fetch(`http://localhost:5000/api/movies/search?query=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data || []);
          setShowSearchDropdown(true);
        })
        .catch((err) => {
          console.error("Error searching movies:", err);
          setSearchResults([]);
          setShowSearchDropdown(false);
        });
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  // Close dropdowns if clicked outside relevant elements

  useEffect(() => {
  const handleUserUpdate = () => {
    const saved = localStorage.getItem("user");
    setUser(saved ? JSON.parse(saved) : null);
  };

  window.addEventListener("user-updated", handleUserUpdate);

  return () => {
    window.removeEventListener("user-updated", handleUserUpdate);
  };
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

  // On pressing Enter in input or clicking Search button, go to search results page
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return;
    setShowSearchDropdown(false);
    navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
  };

  // Navigate to movie detail page on clicking a suggestion
  const handleSuggestionClick = (movie_id) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/details/movies/${movie_id}`);
  };

  return (
    <div className="top-bar">
      <div className="right-controls">
        <button
          type="button"
          className="top-series-btn"
          onClick={() => navigate("/top-series")}
        >
          Top Series
        </button>
        <button
          type="button"
          className="top-movies-btn"
          onClick={() => navigate("/top-movies")}
        >
          Top Movies
        </button>

        {!user ? (
          <button
            type="button"
            className="login-btn"
            onClick={() => navigate("/login")}
          >
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
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate("/your-profile");
                  }}
                >
                  Your Profile
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate("/your-watchlist");
                  }}
                >
                  Your Watchlist
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate("/your-ratings");
                  }}
                >
                  Your Ratings
                </button>
                <button
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="center-search-form"
        ref={searchInputRef}
        style={{ position: "relative" }}
      >
        {user && user.is_admin && (
          <button
            type="button"
            className="admin-btn"
            onClick={() => navigate("/admin")}
            style={{ marginRight: "0.5rem" }}
          >
            Admin
          </button>
        )}
        <button
          type="button"
          className="community-btn"
          onClick={() => navigate("/community")}
          style={{ marginRight: "0.5rem" }}
        >
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
            {searchResults.map((movie) => (
              <div
                key={movie.movie_id}
                className="search-suggestion-card"
                onClick={() => handleSuggestionClick(movie.movie_id)}
              >
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="suggestion-poster"
                />
                <div className="suggestion-info">
                  <p className="suggestion-title">{movie.title}</p>
                  <p className="suggestion-subinfo">Rating: {movie.rating}</p>
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
