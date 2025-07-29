import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Genre.css';

const Genre = () => {
  const { genre } = useParams();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('movies');
  const [selectedGenres, setSelectedGenres] = useState([genre]);
  const [allGenres, setAllGenres] = useState([]);

  // Fetch all available genres
  useEffect(() => {
  const fetchAllGenres = async () => {
    

    try {
      const res = await fetch("http://localhost:5000/api/genres");
      if (!res.ok) throw new Error("Failed to fetch genres");
      const data = await res.json();

      // Normalize response (handle both arrays & objects with `genres` key)
      let genres = [];
      if (Array.isArray(data)) {
        genres = data.map(g => (typeof g === "string" ? g : g.name));
      } else if (data.genres) {
        genres = data.genres.map(g => (typeof g === "string" ? g : g.name));
      }

      // If API returned nothing, fallback
      if (genres.length === 0) {
        genres = fallbackGenres;
      }

      setAllGenres(genres.sort());
    } catch (error) {
      console.error("Error fetching genres:", error);
      setAllGenres(fallbackGenres.sort());
    }
  };

  fetchAllGenres();
}, []);


  // Fetch content based on selected genres
  useEffect(() => {
    const fetchGenreContent = async () => {
      setLoading(true);
      try {
        // For each selected genre, fetch movies and series
        const genreResults = {
          movies: {},
          series: {}
        };

        for (const selectedGenre of selectedGenres) {
          try {
            // Fetch movies by genre
            const moviesRes = await fetch(`http://localhost:5000/api/movies/genre/${encodeURIComponent(selectedGenre)}`);
            if (moviesRes.ok) {
              const moviesData = await moviesRes.json();
              genreResults.movies[selectedGenre] = moviesData.map(m => m.movie_id);
            }

            // Fetch series by genre
            const seriesRes = await fetch(`http://localhost:5000/api/series/genre/${encodeURIComponent(selectedGenre)}`);
            if (seriesRes.ok) {
              const seriesData = await seriesRes.json();
              genreResults.series[selectedGenre] = seriesData.map(s => s.series_id);
            }
          } catch (error) {
            console.error(`Error fetching ${selectedGenre} content:`, error);
          }
        }

        // Find intersection of movie IDs (movies that appear in ALL selected genres)
        const movieIdsByGenre = Object.values(genreResults.movies);
        const commonMovieIds = movieIdsByGenre.length > 0 
          ? movieIdsByGenre.reduce((intersection, currentIds) => 
              intersection.filter(id => currentIds.includes(id)), movieIdsByGenre[0])
          : [];

        // Find intersection of series IDs (series that appear in ALL selected genres)
        const seriesIdsByGenre = Object.values(genreResults.series);
        const commonSeriesIds = seriesIdsByGenre.length > 0 
          ? seriesIdsByGenre.reduce((intersection, currentIds) => 
              intersection.filter(id => currentIds.includes(id)), seriesIdsByGenre[0])
          : [];

        // Fetch full movie/series data for the common IDs
        const allMovies = [];
        const allSeries = [];

        // Fetch movies that have ALL selected genres
        for (const selectedGenre of selectedGenres) {
          try {
            const moviesRes = await fetch(`http://localhost:5000/api/movies/genre/${encodeURIComponent(selectedGenre)}`);
            if (moviesRes.ok) {
              const moviesData = await moviesRes.json();
              // Only include movies that are in the common IDs
              const filteredMovies = moviesData.filter(movie => commonMovieIds.includes(movie.movie_id));
              allMovies.push(...filteredMovies);
            }
          } catch (error) {
            console.error(`Error fetching ${selectedGenre} movies:`, error);
          }
        }

        // Fetch series that have ALL selected genres
        for (const selectedGenre of selectedGenres) {
          try {
            const seriesRes = await fetch(`http://localhost:5000/api/series/genre/${encodeURIComponent(selectedGenre)}`);
            if (seriesRes.ok) {
              const seriesData = await seriesRes.json();
              // Only include series that are in the common IDs
              const filteredSeries = seriesData.filter(series => commonSeriesIds.includes(series.series_id));
              allSeries.push(...filteredSeries);
            }
          } catch (error) {
            console.error(`Error fetching ${selectedGenre} series:`, error);
          }
        }

        // Remove duplicates
        const uniqueMovies = removeDuplicates(allMovies, 'movie_id');
        const uniqueSeries = removeDuplicates(allSeries, 'series_id');

        setMovies(uniqueMovies);
        setSeries(uniqueSeries);
      } catch (error) {
        console.error('Error fetching genre content:', error);
        setMovies([]);
        setSeries([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedGenres.length > 0) {
      fetchGenreContent();
    }
  }, [selectedGenres]);

  // Helper function to remove duplicates
  const removeDuplicates = (array, idKey) => {
    const seen = new Set();
    return array.filter(item => {
      const duplicate = seen.has(item[idKey]);
      seen.add(item[idKey]);
      return !duplicate;
    });
  };

  // Handle genre button clicks
  const handleGenreClick = (clickedGenre) => {
    const newSelectedGenres = selectedGenres.includes(clickedGenre)
      ? selectedGenres.filter(g => g !== clickedGenre)
      : [...selectedGenres, clickedGenre];
    
    setSelectedGenres(newSelectedGenres);
  };

  const handleMovieClick = (movieId) => {
    navigate(`/details/movies/${movieId}`);
  };

  const handleSeriesClick = (seriesId) => {
    navigate(`/details/series/${seriesId}`);
  };

  if (loading) {
    return <div className="genre-loader">Loading {selectedGenres.join(' + ')} content...</div>;
  }

  return (
    <div className="genre-container">
      <h1 className="genre-title">
        {selectedGenres.length > 0 ? `${selectedGenres.join(' + ')}` : 'All'}
      </h1>
      
      <div className="genre-filter-buttons">
        {allGenres.map((genreName) => (
          <button
            key={genreName}
            className={`genre-filter-btn ${selectedGenres.includes(genreName) ? 'active' : ''}`}
            onClick={() => handleGenreClick(genreName)}
          >
            {genreName}
          </button>
        ))}
      </div>
      
      <div className="genre-tabs">
        <button 
          className={`genre-tab ${activeTab === 'movies' ? 'active' : ''}`}
          onClick={() => setActiveTab('movies')}
        >
          Movies ({movies.length})
        </button>
        <button 
          className={`genre-tab ${activeTab === 'series' ? 'active' : ''}`}
          onClick={() => setActiveTab('series')}
        >
          Series ({series.length})
        </button>
      </div>

      <div className="genre-content">
        {activeTab === 'movies' && (
          <div className="genre-grid">
            {movies.length > 0 ? (
              movies.map((movie) => (
                <div 
                  key={movie.movie_id} 
                  className="genre-item"
                  onClick={() => handleMovieClick(movie.movie_id)}
                >
                  <img 
                    src={movie.poster_url} 
                    alt={movie.title}
                    className="genre-poster"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='180'><rect width='100%' height='100%' fill='%23222'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23aaa' font-size='16'>No Image</text></svg>";
                    }}
                  />
                  <div className="genre-item-info">
                    <h3 className="genre-item-title">{movie.title}</h3>
                    <p className="genre-item-rating">⭐ {movie.rating || 'N/A'}</p>
                    <div className="genre-item-genres">
                      {selectedGenres.map((g, i) => (
                        <span key={i} className="genre-item-tag">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="genre-empty">No movies found for {selectedGenres.join(' + ')}</p>
            )}
          </div>
        )}

        {activeTab === 'series' && (
          <div className="genre-grid">
            {series.length > 0 ? (
              series.map((seriesItem) => (
                <div 
                  key={seriesItem.series_id} 
                  className="genre-item"
                  onClick={() => handleSeriesClick(seriesItem.series_id)}
                >
                  <img 
                    src={seriesItem.poster_url} 
                    alt={seriesItem.title}
                    className="genre-poster"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='180'><rect width='100%' height='100%' fill='%23222'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23aaa' font-size='16'>No Image</text></svg>";
                    }}
                  />
                  <div className="genre-item-info">
                    <h3 className="genre-item-title">{seriesItem.title}</h3>
                    <p className="genre-item-rating">⭐ {seriesItem.rating || 'N/A'}</p>
                    <div className="genre-item-genres">
                      {selectedGenres.map((g, i) => (
                        <span key={i} className="genre-item-tag">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="genre-empty">No series found for {selectedGenres.join(' + ')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Genre; 