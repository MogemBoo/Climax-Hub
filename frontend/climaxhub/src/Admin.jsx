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
    genres: '',
    cast: '',
    cast_images: '',
    crew: '',
    crew_images: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Parse genres, cast, and crew from comma-separated strings
      const genres = movieData.genres.split(',').map(g => g.trim()).filter(g => g);
      
      // Parse cast with names and images
      const castNames = movieData.cast.split(',').map(c => c.trim()).filter(c => c);
      const castImages = movieData.cast_images.split(',').map(c => c.trim()).filter(c => c);
      const cast = castNames.map((name, index) => ({
        name,
        birthdate: null,
        bio: null,
        profile_img_url: castImages[index] || null,
        popularity: 0,
        character_name: name
      }));

      // Parse crew with names and images
      const crewNames = movieData.crew.split(',').map(c => c.trim()).filter(c => c);
      const crewImages = movieData.crew_images.split(',').map(c => c.trim()).filter(c => c);
      const crew = crewNames.map((name, index) => ({
        name,
        birthdate: null,
        bio: null,
        profile_img_url: crewImages[index] || null,
        popularity: 0,
        role: name
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
          genres: '',
          cast: '',
          cast_images: '',
          crew: '',
          crew_images: ''
        });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMovieData(prev => ({
      ...prev,
      [name]: value
    }));
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
              <label>Cast (comma-separated)</label>
              <input
                type="text"
                name="cast"
                value={movieData.cast}
                onChange={handleInputChange}
                placeholder="Actor 1, Actor 2, Actor 3"
              />
            </div>

            <div className="form-group">
              <label>Cast Profile Images (comma-separated URLs)</label>
              <input
                type="text"
                name="cast_images"
                value={movieData.cast_images}
                onChange={handleInputChange}
                placeholder="https://example.com/actor1.jpg, https://example.com/actor2.jpg"
              />
              <small className="form-help">Enter image URLs in the same order as cast names</small>
            </div>

            <div className="form-group">
              <label>Crew (comma-separated)</label>
              <input
                type="text"
                name="crew"
                value={movieData.crew}
                onChange={handleInputChange}
                placeholder="Director, Producer, Writer"
              />
            </div>

            <div className="form-group">
              <label>Crew Profile Images (comma-separated URLs)</label>
              <input
                type="text"
                name="crew_images"
                value={movieData.crew_images}
                onChange={handleInputChange}
                placeholder="https://example.com/director.jpg, https://example.com/producer.jpg"
              />
              <small className="form-help">Enter image URLs in the same order as crew names</small>
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
          <p className="form-subtitle">Series form coming soon...</p>
          <button 
            className="cancel-btn"
            onClick={() => setShowSeriesForm(false)}
          >
            Back to Admin Panel
          </button>
        </div>
      )}
    </div>
  );
};

export default Admin; 