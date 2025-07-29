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

  const parseFloatSafe = (v) => (v ? parseFloat(v) : 0);
  const parseIntSafe = (v) => (v ? parseInt(v) : 0);

  // Submit Movie
  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const genres = movieData.genres.split(',').map(g => g.trim()).filter(g => g);
      const cast = movieCast.map(p => ({ ...p, popularity: parseFloatSafe(p.popularity) }));
      const crew = movieCrew.map(p => ({ ...p, popularity: parseFloatSafe(p.popularity) }));

      const response = await fetch('http://localhost:5000/api/movies/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...movieData,
          genres,
          cast,
          crew,
          rating: parseFloatSafe(movieData.rating),
          vote_count: parseIntSafe(movieData.vote_count)
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`Success! Movie added with ID: ${result.movie_id}`);
        setMovieData({ title: '', release_date: '', duration: '', description: '', rating: '', vote_count: '', poster_url: '', trailer_url: '', genres: '' });
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

  // Submit Series
  const handleSeriesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const genres = seriesData.genres.split(',').map(g => g.trim()).filter(g => g);
      const cast = seriesCast.map(p => ({ ...p, popularity: parseFloatSafe(p.popularity) }));
      const crew = seriesCrew.map(p => ({ ...p, popularity: parseFloatSafe(p.popularity) }));
      const seasonsData = seasons.map(s => ({
        ...s,
        season_number: parseIntSafe(s.season_number),
        episodes: (s.episodes || []).map(ep => ({
          ...ep,
          episode_number: parseIntSafe(ep.episode_number),
          duration: parseIntSafe(ep.duration)
        }))
      }));

      const response = await fetch('http://localhost:5000/api/series/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...seriesData,
          genres,
          cast,
          crew,
          seasons: seasonsData,
          rating: parseFloatSafe(seriesData.rating),
          vote_count: parseIntSafe(seriesData.vote_count)
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`Success! Series added with ID: ${result.series_id}`);
        setSeriesData({ title: '', start_date: '', end_date: '', description: '', rating: '', vote_count: '', poster_url: '', trailer_url: '', genres: '' });
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

  // Input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showMovieForm) setMovieData(prev => ({ ...prev, [name]: value }));
    if (showSeriesForm) setSeriesData(prev => ({ ...prev, [name]: value }));
  };

  // Cast/Crew helpers
  const addMovieCast = () => setMovieCast(prev => [...prev, { name: '', character_name: '', birthdate: '', bio: '', profile_img_url: '', popularity: '' }]);
  const removeMovieCast = (i) => setMovieCast(prev => prev.filter((_, idx) => idx !== i));
  const updateMovieCast = (i, f, v) => setMovieCast(prev => prev.map((p, idx) => idx === i ? { ...p, [f]: v } : p));

  const addMovieCrew = () => setMovieCrew(prev => [...prev, { name: '', role: '', birthdate: '', bio: '', profile_img_url: '', popularity: '' }]);
  const removeMovieCrew = (i) => setMovieCrew(prev => prev.filter((_, idx) => idx !== i));
  const updateMovieCrew = (i, f, v) => setMovieCrew(prev => prev.map((p, idx) => idx === i ? { ...p, [f]: v } : p));

  const addSeriesCast = () => setSeriesCast(prev => [...prev, { name: '', character_name: '', birthdate: '', bio: '', profile_img_url: '', popularity: '' }]);
  const removeSeriesCast = (i) => setSeriesCast(prev => prev.filter((_, idx) => idx !== i));
  const updateSeriesCast = (i, f, v) => setSeriesCast(prev => prev.map((p, idx) => idx === i ? { ...p, [f]: v } : p));

  const addSeriesCrew = () => setSeriesCrew(prev => [...prev, { name: '', role: '', birthdate: '', bio: '', profile_img_url: '', popularity: '' }]);
  const removeSeriesCrew = (i) => setSeriesCrew(prev => prev.filter((_, idx) => idx !== i));
  const updateSeriesCrew = (i, f, v) => setSeriesCrew(prev => prev.map((p, idx) => idx === i ? { ...p, [f]: v } : p));

  // Seasons & Episodes
  const addSeason = () => setSeasons(prev => [...prev, { season_number: prev.length + 1, release_date: '', description: '', trailer_url: '', episodes: [] }]);
  const removeSeason = (i) => setSeasons(prev => prev.filter((_, idx) => idx !== i));
  const updateSeason = (i, f, v) => setSeasons(prev => prev.map((s, idx) => idx === i ? { ...s, [f]: v } : s));

  const addEpisode = (si) => setSeasons(prev => prev.map((s, idx) => idx === si ? { ...s, episodes: [...(s.episodes || []), { episode_number: '', title: '', air_date: '', duration: '', description: '' }] } : s));
  const removeEpisode = (si, ei) => setSeasons(prev => prev.map((s, idx) => idx === si ? { ...s, episodes: s.episodes.filter((_, eIdx) => eIdx !== ei) } : s));
  const updateEpisode = (si, ei, f, v) => setSeasons(prev => prev.map((s, idx) => idx === si ? { ...s, episodes: s.episodes.map((ep, j) => j === ei ? { ...ep, [f]: v } : ep) } : s));

  const renderPersonFields = (person, index, updateFn, isCast) => (
    <div key={index} className="cast-item">
      <div className="cast-header">
        <h4>{isCast ? "Cast" : "Crew"} Member {index + 1}</h4>
        <button type="button" className="remove-cast-btn" onClick={() => updateFn(index, 'remove')}>Remove</button>
      </div>
      <div className="cast-fields">
        <div className="form-row">
          <div className="form-group">
            <label>Name *</label>
            <input type="text" value={person.name} onChange={(e) => updateFn(index, 'name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>{isCast ? "Character Name" : "Role"}</label>
            <input type="text" value={isCast ? person.character_name : person.role} onChange={(e) => updateFn(index, isCast ? 'character_name' : 'role', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Birthdate</label>
            <input type="date" value={person.birthdate} onChange={(e) => updateFn(index, 'birthdate', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Popularity</label>
            <input type="number" step="0.1" min="0" value={person.popularity} onChange={(e) => updateFn(index, 'popularity', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea value={person.bio} onChange={(e) => updateFn(index, 'bio', e.target.value)} rows="2" />
        </div>
        <div className="form-group">
          <label>Profile Image URL</label>
          <input type="url" value={person.profile_img_url} onChange={(e) => updateFn(index, 'profile_img_url', e.target.value)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Panel</h1>
      {message && <div className={`admin-message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

      {!showMovieForm && !showSeriesForm && (
        <div className="admin-content">
          <button className="add-content-btn" onClick={() => setShowMovieForm(true)}>Add Movie</button>
          <button className="add-content-btn" onClick={() => setShowSeriesForm(true)}>Add Series</button>
        </div>
      )}

      {/* Movie Form */}
      {showMovieForm && (
        <div className="admin-form-container">
          <h2 className="form-title">Add New Movie</h2>
          <form onSubmit={handleMovieSubmit} className="admin-form">
            <div className="form-group"><label>Title *</label><input type="text" name="title" value={movieData.title} onChange={handleInputChange} required /></div>
            <div className="form-group"><label>Release Date *</label><input type="date" name="release_date" value={movieData.release_date} onChange={handleInputChange} required /></div>
            <div className="form-group"><label>Duration (minutes) *</label><input type="number" name="duration" value={movieData.duration} onChange={handleInputChange} required /></div>
            <div className="form-group"><label>Description *</label><textarea name="description" value={movieData.description} onChange={handleInputChange} required rows="3" /></div>
            <div className="form-row">
              <div className="form-group"><label>Rating</label><input type="number" name="rating" value={movieData.rating} onChange={handleInputChange} step="0.1" min="0" max="10" /></div>
              <div className="form-group"><label>Vote Count</label><input type="number" name="vote_count" value={movieData.vote_count} onChange={handleInputChange} min="0" /></div>
            </div>
            <div className="form-group"><label>Poster URL</label><input type="url" name="poster_url" value={movieData.poster_url} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Trailer URL</label><input type="url" name="trailer_url" value={movieData.trailer_url} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Genres (comma-separated)</label><input type="text" name="genres" value={movieData.genres} onChange={handleInputChange} placeholder="Action, Drama, Thriller" /></div>

            {/* Cast */}
            <div className="form-group"><label>Cast</label>
              <div className="cast-container">{movieCast.map((p, idx) => renderPersonFields(p, idx, (i, f, v) => { if (f === 'remove') removeMovieCast(i); else updateMovieCast(i, f, v); }, true))}
                <button type="button" className="add-cast-btn" onClick={addMovieCast}>+ Add Cast Member</button></div>
            </div>
            {/* Crew */}
            <div className="form-group"><label>Crew</label>
              <div className="crew-container">{movieCrew.map((p, idx) => renderPersonFields(p, idx, (i, f, v) => { if (f === 'remove') removeMovieCrew(i); else updateMovieCrew(i, f, v); }, false))}
                <button type="button" className="add-crew-btn" onClick={addMovieCrew}>+ Add Crew Member</button></div>
            </div>
            <div className="form-buttons"><button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Adding Movie...' : 'Add Movie'}</button><button type="button" className="cancel-btn" onClick={() => { setShowMovieForm(false); setMessage(''); setMovieCast([]); setMovieCrew([]); }}>Cancel</button></div>
          </form>
        </div>
      )}

      {/* Series Form */}
      {showSeriesForm && (
        <div className="admin-form-container">
          <h2 className="form-title">Add New Series</h2>
          <form onSubmit={handleSeriesSubmit} className="admin-form">
            <div className="form-group"><label>Title *</label><input type="text" name="title" value={seriesData.title} onChange={handleInputChange} required /></div>
            <div className="form-row"><div className="form-group"><label>Start Date *</label><input type="date" name="start_date" value={seriesData.start_date} onChange={handleInputChange} required /></div><div className="form-group"><label>End Date</label><input type="date" name="end_date" value={seriesData.end_date} onChange={handleInputChange} /></div></div>
            <div className="form-group"><label>Description *</label><textarea name="description" value={seriesData.description} onChange={handleInputChange} required rows="3" /></div>
            <div className="form-row"><div className="form-group"><label>Rating</label><input type="number" name="rating" value={seriesData.rating} onChange={handleInputChange} step="0.1" min="0" max="10" /></div><div className="form-group"><label>Vote Count</label><input type="number" name="vote_count" value={seriesData.vote_count} onChange={handleInputChange} min="0" /></div></div>
            <div className="form-group"><label>Poster URL</label><input type="url" name="poster_url" value={seriesData.poster_url} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Trailer URL</label><input type="url" name="trailer_url" value={seriesData.trailer_url} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Genres (comma-separated)</label><input type="text" name="genres" value={seriesData.genres} onChange={handleInputChange} placeholder="Action, Drama, Thriller" /></div>

            {/* Cast */}
            <div className="form-group"><label>Cast</label>
              <div className="cast-container">{seriesCast.map((p, idx) => renderPersonFields(p, idx, (i, f, v) => { if (f === 'remove') removeSeriesCast(i); else updateSeriesCast(i, f, v); }, true))}
                <button type="button" className="add-cast-btn" onClick={addSeriesCast}>+ Add Cast Member</button></div>
            </div>
            {/* Crew */}
            <div className="form-group"><label>Crew</label>
              <div className="crew-container">{seriesCrew.map((p, idx) => renderPersonFields(p, idx, (i, f, v) => { if (f === 'remove') removeSeriesCrew(i); else updateSeriesCrew(i, f, v); }, false))}
                <button type="button" className="add-crew-btn" onClick={addSeriesCrew}>+ Add Crew Member</button></div>
            </div>

            {/* Seasons + Episodes */}
            <div className="form-group"><label>Seasons</label>
              <div className="seasons-container">{seasons.map((season, si) => (
                <div key={si} className="season-item">
                  <div className="season-header"><h4>Season {season.season_number}</h4><button type="button" className="remove-season-btn" onClick={() => removeSeason(si)}>Remove</button></div>
                  <div className="season-fields">
                    <div className="form-row"><div className="form-group"><label>Season Number</label><input type="number" value={season.season_number} onChange={(e) => updateSeason(si, 'season_number', e.target.value)} min="1" /></div><div className="form-group"><label>Release Date</label><input type="date" value={season.release_date} onChange={(e) => updateSeason(si, 'release_date', e.target.value)} /></div></div>
                    <div className="form-group"><label>Description</label><textarea value={season.description} onChange={(e) => updateSeason(si, 'description', e.target.value)} rows="2" /></div>
                    <div className="form-group"><label>Trailer URL</label><input type="url" value={season.trailer_url} onChange={(e) => updateSeason(si, 'trailer_url', e.target.value)} /></div>
                  </div>

                  {/* Episodes */}
                  <div className="episodes-container">
                    <h4>Episodes</h4>
                    {season.episodes && season.episodes.map((ep, ei) => (
                      <div key={ei} className="episode-item">
                        <div className="form-row">
                          <div className="form-group"><label>Episode #</label><input type="number" value={ep.episode_number} onChange={(e) => updateEpisode(si, ei, 'episode_number', e.target.value)} /></div>
                          <div className="form-group"><label>Title</label><input type="text" value={ep.title} onChange={(e) => updateEpisode(si, ei, 'title', e.target.value)} /></div>
                        </div>
                        <div className="form-row">
                          <div className="form-group"><label>Air Date</label><input type="date" value={ep.air_date} onChange={(e) => updateEpisode(si, ei, 'air_date', e.target.value)} /></div>
                          <div className="form-group"><label>Duration (min)</label><input type="number" value={ep.duration} onChange={(e) => updateEpisode(si, ei, 'duration', e.target.value)} /></div>
                        </div>
                        <div className="form-group"><label>Description</label><textarea value={ep.description} onChange={(e) => updateEpisode(si, ei, 'description', e.target.value)} rows="2" /></div>
                        <button type="button" className="remove-cast-btn" onClick={() => removeEpisode(si, ei)}>Remove Episode</button>
                      </div>
                    ))}
                    <button type="button" className="add-episode-btn" onClick={() => addEpisode(si)}>+ Add Episode</button>
                  </div>
                </div>
              ))}
                <button type="button" className="add-season-btn" onClick={addSeason}>+ Add Season</button>
              </div>
            </div>

            <div className="form-buttons"><button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Adding Series...' : 'Add Series'}</button><button type="button" className="cancel-btn" onClick={() => { setShowSeriesForm(false); setMessage(''); setSeriesCast([]); setSeriesCrew([]); setSeasons([]); }}>Cancel</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Admin;
