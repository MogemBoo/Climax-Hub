import React, { useState } from "react";
import "./Admin.css";

const Admin = () => {
  const [showMovieForm, setShowMovieForm] = useState(false);
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [movieData, setMovieData] = useState({
    title: '',
    release_date: '',
    duration: '',
    description: '',
    rating: '',
    vote_count: '',
    poster_url: '',
    trailer_url: '',
    genres: ''
  });
  const [seriesData, setSeriesData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    description: '',
    rating: '',
    vote_count: '',
    poster_url: '',
    trailer_url: '',
    genres: ''
  });
  const [movieCast, setMovieCast] = useState([]);
  const [movieCrew, setMovieCrew] = useState([]);
  const [seriesCast, setSeriesCast] = useState([]);
  const [seriesCrew, setSeriesCrew] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Parse genres from comma-separated strings
      const genres = movieData.genres.split(',').map(g => g.trim()).filter(g => g);
      
      // Convert cast to backend format
      const cast = movieCast.map(person => ({
        name: person.name,
        birthdate: null,
        bio: null,
        profile_img_url: person.profile_img_url || null,
        popularity: 0,
        character_name: person.character_name || person.name
      }));

      // Convert crew to backend format
      const crew = movieCrew.map(person => ({
        name: person.name,
        birthdate: null,
        bio: null,
        profile_img_url: person.profile_img_url || null,
        popularity: 0,
        role: person.role || person.name
      }));

      const response = await fetch('http://localhost:5000/api/movies/full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...movieData,
          genres,
          cast,
          crew,
          rating: parseFloat(movieData.rating) || 0,
          vote_count: parseInt(movieData.vote_count) || 0
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`Success! Movie added with ID: ${result.movie_id}`);
        setMovieData({
          title: '',
          release_date: '',
          duration: '',
          description: '',
          rating: '',
          vote_count: '',
          poster_url: '',
          trailer_url: '',
          genres: ''
        });
        setMovieCast([]);
        setMovieCrew([]);
        setShowMovieForm(false);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || 'Failed to add movie'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeriesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Parse genres from comma-separated strings
      const genres = seriesData.genres.split(',').map(g => g.trim()).filter(g => g);
      
      // Convert cast to backend format
      const cast = seriesCast.map(person => ({
        name: person.name,
        birthdate: null,
        bio: null,
        profile_img_url: person.profile_img_url || null,
        popularity: 0,
        character_name: person.character_name || person.name
      }));

      // Convert crew to backend format
      const crew = seriesCrew.map(person => ({
        name: person.name,
        birthdate: null,
        bio: null,
        profile_img_url: person.profile_img_url || null,
        popularity: 0,
        role: person.role || person.name
      }));

      // Convert seasons to backend format
      const seasonsData = seasons.map(season => ({
        season_number: parseInt(season.season_number) || 1,
        release_date: season.release_date || null,
        description: season.description || '',
        trailer_url: season.trailer_url || null,
        episodes: [] // For now, episodes will be empty
      }));

      const response = await fetch('http://localhost:5000/api/series/full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...seriesData,
          genres,
          cast,
          crew,
          seasons: seasonsData,
          rating: parseFloat(seriesData.rating) || 0,
          vote_count: parseInt(seriesData.vote_count) || 0
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`Success! Series added with ID: ${result.series_id}`);
        setSeriesData({
          title: '',
          start_date: '',
          end_date: '',
          description: '',
          rating: '',
          vote_count: '',
          poster_url: '',
          trailer_url: '',
          genres: ''
        });
        setSeriesCast([]);
        setSeriesCrew([]);
        setSeasons([]);
        setShowSeriesForm(false);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || 'Failed to add series'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showMovieForm) {
      setMovieData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (showSeriesForm) {
      setSeriesData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Cast functions for movies
  const addMovieCast = () => {
    setMovieCast(prev => [...prev, {
      name: '',
      character_name: '',
      profile_img_url: ''
    }]);
  };

  const removeMovieCast = (index) => {
    setMovieCast(prev => prev.filter((_, i) => i !== index));
  };

  const updateMovieCast = (index, field, value) => {
    setMovieCast(prev => prev.map((person, i) => 
      i === index ? { ...person, [field]: value } : person
    ));
  };

  // Crew functions for movies
  const addMovieCrew = () => {
    setMovieCrew(prev => [...prev, {
      name: '',
      role: '',
      profile_img_url: ''
    }]);
  };

  const removeMovieCrew = (index) => {
    setMovieCrew(prev => prev.filter((_, i) => i !== index));
  };

  const updateMovieCrew = (index, field, value) => {
    setMovieCrew(prev => prev.map((person, i) => 
      i === index ? { ...person, [field]: value } : person
    ));
  };

  // Cast functions for series
  const addSeriesCast = () => {
    setSeriesCast(prev => [...prev, {
      name: '',
      character_name: '',
      profile_img_url: ''
    }]);
  };

  const removeSeriesCast = (index) => {
    setSeriesCast(prev => prev.filter((_, i) => i !== index));
  };

  const updateSeriesCast = (index, field, value) => {
    setSeriesCast(prev => prev.map((person, i) => 
      i === index ? { ...person, [field]: value } : person
    ));
  };

  // Crew functions for series
  const addSeriesCrew = () => {
    setSeriesCrew(prev => [...prev, {
      name: '',
      role: '',
      profile_img_url: ''
    }]);
  };

  const removeSeriesCrew = (index) => {
    setSeriesCrew(prev => prev.filter((_, i) => i !== index));
  };

  const updateSeriesCrew = (index, field, value) => {
    setSeriesCrew(prev => prev.map((person, i) => 
      i === index ? { ...person, [field]: value } : person
    ));
  };

  // Season functions
  const addSeason = () => {
    setSeasons(prev => [...prev, {
      season_number: prev.length + 1,
      release_date: '',
      description: '',
      trailer_url: ''
    }]);
  };

  const removeSeason = (index) => {
    setSeasons(prev => prev.filter((_, i) => i !== index));
  };

  const updateSeason = (index, field, value) => {
    setSeasons(prev => prev.map((season, i) => 
      i === index ? { ...season, [field]: value } : season
    ));
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Panel</h1>
      
      {message && (
        <div className={`admin-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {!showMovieForm && !showSeriesForm && (
        <div className="admin-content">
          <button 
            className="add-content-btn"
            onClick={() => setShowMovieForm(true)}
          >
            Add Movie
          </button>
          <button 
            className="add-content-btn"
            onClick={() => setShowSeriesForm(true)}
          >
            Add Series
          </button>
        </div>
      )}

      {showMovieForm && (
        <div className="admin-form-container">
          <h2 className="form-title">Add New Movie</h2>
          <form onSubmit={handleMovieSubmit} className="admin-form">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={movieData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Release Date *</label>
              <input
                type="date"
                name="release_date"
                value={movieData.release_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                value={movieData.duration}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={movieData.description}
                onChange={handleInputChange}
                required
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rating</label>
                <input
                  type="number"
                  name="rating"
                  value={movieData.rating}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="10"
                />
              </div>

              <div className="form-group">
                <label>Vote Count</label>
                <input
                  type="number"
                  name="vote_count"
                  value={movieData.vote_count}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Poster URL</label>
              <input
                type="url"
                name="poster_url"
                value={movieData.poster_url}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Trailer URL</label>
              <input
                type="url"
                name="trailer_url"
                value={movieData.trailer_url}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Genres (comma-separated)</label>
              <input
                type="text"
                name="genres"
                value={movieData.genres}
                onChange={handleInputChange}
                placeholder="Action, Drama, Thriller"
              />
            </div>

            <div className="form-group">
              <label>Cast</label>
              <div className="cast-container">
                {movieCast.map((person, index) => (
                  <div key={index} className="cast-item">
                    <div className="cast-header">
                      <h4>Cast Member {index + 1}</h4>
                      <button
                        type="button"
                        className="remove-cast-btn"
                        onClick={() => removeMovieCast(index)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="cast-fields">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Name *</label>
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => updateMovieCast(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Character Name</label>
                          <input
                            type="text"
                            value={person.character_name}
                            onChange={(e) => updateMovieCast(index, 'character_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Profile Image URL</label>
                        <input
                          type="url"
                          value={person.profile_img_url}
                          onChange={(e) => updateMovieCast(index, 'profile_img_url', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-cast-btn"
                  onClick={addMovieCast}
                >
                  + Add Cast Member
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Crew</label>
              <div className="crew-container">
                {movieCrew.map((person, index) => (
                  <div key={index} className="crew-item">
                    <div className="crew-header">
                      <h4>Crew Member {index + 1}</h4>
                      <button
                        type="button"
                        className="remove-crew-btn"
                        onClick={() => removeMovieCrew(index)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="crew-fields">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Name *</label>
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => updateMovieCrew(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Role</label>
                          <input
                            type="text"
                            value={person.role}
                            onChange={(e) => updateMovieCrew(index, 'role', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Profile Image URL</label>
                        <input
                          type="url"
                          value={person.profile_img_url}
                          onChange={(e) => updateMovieCrew(index, 'profile_img_url', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-crew-btn"
                  onClick={addMovieCrew}
                >
                  + Add Crew Member
                </button>
              </div>
            </div>

            <div className="form-buttons">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Adding Movie...' : 'Add Movie'}
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowMovieForm(false);
                  setMessage('');
                  setMovieCast([]);
                  setMovieCrew([]);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showSeriesForm && (
        <div className="admin-form-container">
          <h2 className="form-title">Add New Series</h2>
          <form onSubmit={handleSeriesSubmit} className="admin-form">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={seriesData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={seriesData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={seriesData.end_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={seriesData.description}
                onChange={handleInputChange}
                required
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rating</label>
                <input
                  type="number"
                  name="rating"
                  value={seriesData.rating}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="10"
                />
              </div>

              <div className="form-group">
                <label>Vote Count</label>
                <input
                  type="number"
                  name="vote_count"
                  value={seriesData.vote_count}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Poster URL</label>
              <input
                type="url"
                name="poster_url"
                value={seriesData.poster_url}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Trailer URL</label>
              <input
                type="url"
                name="trailer_url"
                value={seriesData.trailer_url}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Genres (comma-separated)</label>
              <input
                type="text"
                name="genres"
                value={seriesData.genres}
                onChange={handleInputChange}
                placeholder="Action, Drama, Thriller"
              />
            </div>

            <div className="form-group">
              <label>Cast</label>
              <div className="cast-container">
                {seriesCast.map((person, index) => (
                  <div key={index} className="cast-item">
                    <div className="cast-header">
                      <h4>Cast Member {index + 1}</h4>
                      <button
                        type="button"
                        className="remove-cast-btn"
                        onClick={() => removeSeriesCast(index)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="cast-fields">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Name *</label>
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => updateSeriesCast(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Character Name</label>
                          <input
                            type="text"
                            value={person.character_name}
                            onChange={(e) => updateSeriesCast(index, 'character_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Profile Image URL</label>
                        <input
                          type="url"
                          value={person.profile_img_url}
                          onChange={(e) => updateSeriesCast(index, 'profile_img_url', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-cast-btn"
                  onClick={addSeriesCast}
                >
                  + Add Cast Member
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Crew</label>
              <div className="crew-container">
                {seriesCrew.map((person, index) => (
                  <div key={index} className="crew-item">
                    <div className="crew-header">
                      <h4>Crew Member {index + 1}</h4>
                      <button
                        type="button"
                        className="remove-crew-btn"
                        onClick={() => removeSeriesCrew(index)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="crew-fields">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Name *</label>
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => updateSeriesCrew(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Role</label>
                          <input
                            type="text"
                            value={person.role}
                            onChange={(e) => updateSeriesCrew(index, 'role', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Profile Image URL</label>
                        <input
                          type="url"
                          value={person.profile_img_url}
                          onChange={(e) => updateSeriesCrew(index, 'profile_img_url', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-crew-btn"
                  onClick={addSeriesCrew}
                >
                  + Add Crew Member
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Seasons</label>
              <div className="seasons-container">
                {seasons.map((season, index) => (
                  <div key={index} className="season-item">
                    <div className="season-header">
                      <h4>Season {season.season_number}</h4>
                      <button
                        type="button"
                        className="remove-season-btn"
                        onClick={() => removeSeason(index)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="season-fields">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Season Number</label>
                          <input
                            type="number"
                            value={season.season_number}
                            onChange={(e) => updateSeason(index, 'season_number', e.target.value)}
                            min="1"
                          />
                        </div>
                        <div className="form-group">
                          <label>Release Date</label>
                          <input
                            type="date"
                            value={season.release_date}
                            onChange={(e) => updateSeason(index, 'release_date', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={season.description}
                          onChange={(e) => updateSeason(index, 'description', e.target.value)}
                          rows="2"
                        />
                      </div>
                      <div className="form-group">
                        <label>Trailer URL</label>
                        <input
                          type="url"
                          value={season.trailer_url}
                          onChange={(e) => updateSeason(index, 'trailer_url', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-season-btn"
                  onClick={addSeason}
                >
                  + Add Season
                </button>
              </div>
            </div>

            <div className="form-buttons">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Adding Series...' : 'Add Series'}
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowSeriesForm(false);
                  setMessage('');
                  setSeriesCast([]);
                  setSeriesCrew([]);
                  setSeasons([]);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Admin; 