import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

let debounceTimer = null;

const HomePage = () => {
  const navigate = useNavigate();
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [recommendedSeries, setRecommendedSeries] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);
  const [recentSeries, setRecentSeries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const topScrollRef = useRef(null);
  const recMovieScrollRef = useRef(null);
  const recSeriesScrollRef = useRef(null);
  const recentMovieScrollRef = useRef(null);
  const recentSeriesScrollRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetch(`http://localhost:5000/api/recommendations/${user.user_id}`)
      .then((res) => res.json())
      .then((data) => {
        setRecommendedMovies(data.movies || []);
        setRecommendedSeries(data.series || []);
      })
      .catch((err) => console.error("Error fetching recommendations:", err));
  }, [user]);

  useEffect(() => {
    fetch("http://localhost:5000/api/movies/recent")
      .then((res) => res.json())
      .then((data) => setRecentMovies(data))
      .catch((err) => console.error("Error fetching recent movies:", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/series/recent")
      .then((res) => res.json())
      .then((data) => setRecentSeries(data))
      .catch((err) => console.error("Error fetching recent series:", err));
  }, []);

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    debounceTimer = setTimeout(() => {
      fetch(`http://localhost:5000/api/movies/search?query=${searchQuery}`)
        .then((res) => res.json())
        .then((data) => setSearchResults(data))
        .catch((err) => {
          console.error("Error searching:", err);
          setSearchResults([]);
        });
    }, 400);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetch(`http://localhost:5000/api/movies/search?query=${searchQuery}`)
      .then((res) => res.json())
      .then((data) => setSearchResults(data))
      .catch((err) => console.error("Error searching movies:", err));
  };

  const handleLogout = () => {
  localStorage.removeItem("user");
  setUser(null);
  setShowDropdown(false);

  setRecommendedMovies([]);
  setRecommendedSeries([]);
  setSearchResults([]);
};


  const handleCardClick = (type, id) => {
    navigate(`/details/${type}/${id}`);
  };

  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest(".user-menu-wrapper")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  return (
    <div className="homepage-container">
      <h1 className="homepage-title">Welcome to ClimaxHub</h1>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search Movies and Series..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>

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
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {user.username}
            </button>
            {showDropdown && (
              <div className="user-dropdown">
                <button className="dropdown-item" onClick={() => navigate("/your-profile")}>
                  Your Profile
                </button>
                <button className="dropdown-item" onClick={() => navigate("/your-watchlist")}> 
                  Your Watchlist
                </button>
                <button className="dropdown-item" onClick={() => navigate("/ratings")}>
                  Your Ratings
                </button>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </form>

      {searchQuery.trim() !== "" && (
        <div className="section">
          <h2 className="section-title">Search Results</h2>
          {searchResults.length > 0 ? (
            <MovieList movies={searchResults} onCardClick={handleCardClick} />
          ) : (
            <p style={{ color: "#bbb", marginTop: "1rem" }}>No results found.</p>
          )}
        </div>
      )}


      {user && (
  <>
    <Section
      title="Recommended Movies for You"
      data={recommendedMovies}
      scrollRef={recMovieScrollRef}
      onCardClick={(type, id) => handleCardClick("movies", id)}
      isRecommendation
      isSeries={false}
    />

    <Section
      title="Recommended Series for You"
      data={recommendedSeries}
      scrollRef={recSeriesScrollRef}
      onCardClick={(type, id) => handleCardClick("series", id)}
      isRecommendation
      isSeries
    />
  </>
)}


      <Section
        title="Recently Released Movies"
        data={recentMovies}
        scrollRef={recentMovieScrollRef}
        onCardClick={(type, id) => handleCardClick("movies", id)}
        isSeries={false}
      />

      <Section
        title="Recently Released Series"
        data={recentSeries}
        scrollRef={recentSeriesScrollRef}
        onCardClick={(type, id) => handleCardClick("series", id)}
        isSeries
      />
    </div>
  );
};

const Section = ({ title, data, scrollRef, onCardClick, isSeries = false, isRecommendation = false }) => (
  <div className="section">
    <h2 className="section-title">{title}</h2>
    <div className="scroll-container">
      <button className="scroll-arrow left" onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })}>←</button>
      {isSeries ? (
        <SeriesList series={data} scrollRef={scrollRef} onCardClick={onCardClick} isRecommendation={isRecommendation} />
      ) : (
        <MovieList movies={data} scrollRef={scrollRef} onCardClick={onCardClick} isRecommendation={isRecommendation} />
      )}
      <button className="scroll-arrow right" onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}>→</button>
    </div>
  </div>
);

const MovieList = ({ movies, scrollRef, onCardClick, isRecommendation = false }) => (
  <div className="movie-horizontal-scroll" ref={scrollRef}>
    {movies.map((movie) => (
      <div
        key={isRecommendation ? movie.recommended_movie_id : movie.movie_id}
        className="movie-scroll-card"
        onClick={() =>
          onCardClick(
            "movies",
            isRecommendation ? movie.recommended_movie_id : movie.movie_id
          )
        }
      >
        <img src={movie.poster_url} alt={movie.title} className="movie-scroll-poster" />
        <div>
          <h3 className="movie-title">{movie.title}</h3>
          <p className="movie-info">Rating: {movie.rating}</p>
          <p className="movie-info">Released: {movie.release_date}</p>
        </div>
      </div>
    ))}
  </div>
);

const SeriesList = ({ series, scrollRef, onCardClick, isRecommendation = false }) => (
  <div className="movie-horizontal-scroll" ref={scrollRef}>
    {series.map((s) => (
      <div
        key={isRecommendation ? s.recommended_series_id : s.series_id}
        className="movie-scroll-card"
        onClick={() =>
          onCardClick(
            "series",
            isRecommendation ? s.recommended_series_id : s.series_id
          )
        }
      >
        <img src={s.poster_url} alt={s.title} className="movie-scroll-poster" />
        <div>
          <h3 className="movie-title">{s.title}</h3>
          <p className="movie-info">Rating: {s.rating}</p>
          <p className="movie-info">Start Date: {s.start_date}</p>
        </div>
      </div>
    ))}
  </div>
);

export default HomePage;
