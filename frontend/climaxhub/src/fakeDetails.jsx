import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import './fakeDetails.css';

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='180'><rect width='100%' height='100%' fill='%23222'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23aaa' font-size='16'>No Image</text></svg>";

const PersonImage = ({ src, alt }) => {
  const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER_IMG);
  return (
    <img
      src={imgSrc}
      onError={() => setImgSrc(PLACEHOLDER_IMG)}
      alt={alt}
      style={{ width: '120px', height: '180px', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '0.5rem', background: '#222', display: 'block' }}
    />
  );
};

const CommentCard = ({ review, isFaded }) => {
  const [expanded, setExpanded] = useState(false);

  const isLongComment = review.comments && review.comments.length > 150;
  const hasComment = review.comments && review.comments.trim() !== "";

  return (
    <div className={`comment-card ${isFaded ? 'faded' : ''}`}>
      <h4 className="comment-username">👤 {review.username}</h4>
      <p className="comment-rating">⭐ {review.rating}/10</p>

      {hasComment && (
        <>
          <p className={`comment-text ${expanded ? "expanded" : ""}`} title={expanded ? "" : review.comments}>
            "{review.comments}"
          </p>

          {isLongComment && (
            <button
              className="see-more-btn"
              onClick={() => setExpanded(!expanded)}
              type="button"
            >
              {expanded ? "See less" : "See more"}
            </button>
          )}
        </>
      )}

      <p className="comment-date">
        {new Date(review.created_at).toLocaleDateString('en-US')}
      </p>
    </div>
  );
};

const Details = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [type, setType] = useState('movie'); // 'movie' or 'series'
  const [showRatingCard, setShowRatingCard] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const commentScrollRef = useRef(null);
  const ratingPopupRef = useRef(null);
  const [starRatingCounts, setStarRatingCounts] = useState([]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [hoveredChartRating, setHoveredChartRating] = useState(null);

  const fetchDetails = async () => {
    const isSeriesPage = location.pathname.includes('/series/');
    // Determine the type string for API calls: 'movies' or 'series'
    const apiEndpointType = isSeriesPage ? 'series' : 'movies';
    // Determine the type string for local state and display: 'movie' or 'series' (singular)
    setType(isSeriesPage ? 'series' : 'movie');

    try {
      // Fetch main movie/series details
      const res = await fetch(`http://localhost:5000/api/${apiEndpointType}/${id}`);
      const json = await res.json();
      setData(json);

      // Fetch star rating counts for both movies and series
      const starCountRes = await fetch(`http://localhost:5000/api/${apiEndpointType}/${id}/per-star-user-count`);
      if (starCountRes.ok) {
        const starCountJson = await starCountRes.json();
        const fullCounts = Array.from({ length: 10 }, (_, i) => ({ rating: i + 1, count: 0 }));
        starCountJson.forEach(item => {
          const index = parseInt(item.rating) - 1;
          if (index >= 0 && index < 10) {
            fullCounts[index].count = parseInt(item.count);
          }
        });
        setStarRatingCounts(fullCounts);
      } else {
        // If star count endpoint doesn't exist or fails, reset counts
        console.warn(`Could not fetch star counts for ${apiEndpointType} with ID ${id}.`);
        setStarRatingCounts([]);
      }

    } catch (err) {
      console.error("Failed to fetch data", err);
      setData(null); // Clear data on error
      setStarRatingCounts([]); // Clear star counts on error
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, location]);

  const fetchUserRating = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      setUserRating(0);
      return;
    }

    // Use the `type` state ('movie' or 'series') to build the endpoint
    try {
      const res = await fetch(`http://localhost:5000/api/rating/${type}/${user.user_id}/${id}`);
      if (!res.ok) {
        setUserRating(0);
        return;
      }

      const data = await res.json();
      setUserRating(data.rating || 0);
      setComment(data.comments || "");
    } catch (err) {
      setUserRating(0);
    }
  };

  const handleToggleRatingCard = () => {
    const newState = !showRatingCard;
    setShowRatingCard(newState);

    if (newState) {
      fetchUserRating();
    }
  };

  const handleAddToWatchlist = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login to add to watchlist.");
      return;
    }

    const body = {
      user_id: user.user_id,
      status: "to-watch",
      [type === "movie" ? "movie_id" : "series_id"]: parseInt(id), // Use 'type' state
    };

    try {
      const res = await fetch("http://localhost:5000/api/watchlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      alert("Added to watchlist successfully!");
    } catch (err) {
      alert("Failed to add to watchlist: " + err.message);
    }
  };

  const handleSubmitRating = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login to submit rating.");
      return;
    }

    // Use the `type` state ('movie' or 'series') to build the endpoint
    const endpoint = type; // 'movie' or 'series'
    const idKey = type === 'movie' ? 'movie_id' : 'series_id';

    const body = {
      user_id: user.user_id,
      rating: userRating,
      comments: comment,
      [idKey]: parseInt(id),
    };

    try {
      const res = await fetch(`http://localhost:5000/api/rating/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("Rating and comment submitted successfully!");
      setShowRatingCard(false);
      setHoverRating(0);
      setComment("");
      fetchDetails(); // Reload reviews and star counts
    } catch (err) {
      alert("Failed to submit rating: " + err.message);
    }
  };

  const handleGenreClick = (genre) => {
    navigate(`/genre/${encodeURIComponent(genre)}`);
  };

  const handleBarClick = (rating) => {
    setSelectedRating(selectedRating === rating ? null : rating);
    setHoveredChartRating(null);
  };

  const handleBarMouseEnter = (rating) => {
    if (selectedRating === null) {
      setHoveredChartRating(rating);
    }
  };

  const handleBarMouseLeave = () => {
    setHoveredChartRating(null);
  };

  // Close rating popup when clicking outside
  useEffect(() => {
    if (!showRatingCard) return;
    function handleClickOutside(e) {
      if (ratingPopupRef.current && !ratingPopupRef.current.contains(e.target)) {
        setShowRatingCard(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRatingCard]);

  // Simplify review handling: get all comments with content
  // Note: data.reviews should ideally already be filtered by the selected rating if it were fetched directly
  // from the backend. Since it's currently fetched as all reviews for the item, we filter it here.
  const reviewsToDisplay = data?.reviews || [];
  const commentsWithContent = reviewsToDisplay.filter(r => r.comments && r.comments.trim() !== "");


  if (!data) return <div className="loader">Loading...</div>;

  const maxCount = Math.max(...(starRatingCounts.map(item => item.count)), 0);
  const totalReviewCount = starRatingCounts.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="fullscreen-wrapper">
      <div className="content row-layout">
        <div className="left-col">
          <img className="poster-large" src={data.poster_url} alt={data.title} />
          <div className="info-under-poster">
            <h1>{data.title}</h1>
            <p className="sub">
              {new Date(type === 'movie' ? data.release_date : data.start_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {data.duration ? ` • ${data.duration} min` : ''}
              {data.rating ? ` • ⭐ ${data.rating}` : ''}
            </p>
            <p className="desc">{data.description}</p>
            <div className="tags">
              {(data.genres || []).map((g, i) => (
                <button
                  className="tag genre-btn"
                  key={i}
                  onClick={() => handleGenreClick(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {data.trailer_url && (
          <div className="right-section">
            <div className="trailer-container">
              <iframe
                src={data.trailer_url.replace("watch?v=", "embed/")}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Trailer"
              ></iframe>
            </div>
          </div>
        )}

        <div className="right-col">
          <div className="action-buttons-row">
            <button className="rating-btn" onClick={handleToggleRatingCard}>
              <span role="img" aria-label="star">⭐</span> {userRating > 0 ? <span className="user-rating-value">{userRating}</span> : 'Rating'}
            </button>
            <button className="watchlist-btn" onClick={handleAddToWatchlist}>
              📌 Watchlist
            </button>
          </div>
        </div>
      </div>

      {showRatingCard && (
        <div className="rating-popup" ref={ratingPopupRef}>
          <div className="rating-card">
            <h3>Rate this {type}</h3>
            <div className="stars">
              {[...Array(10)].map((_, index) => {
                const ratingVal = index + 1;
                return (
                  <label key={ratingVal}>
                    <input
                      type="radio"
                      name="rating"
                      value={ratingVal}
                      style={{ display: "none" }}
                    />
                    <FaStar
                      size={24}
                      color={ratingVal <= (hoverRating || userRating) ? '#ffc107' : '#444'}
                      onMouseEnter={() => setHoverRating(ratingVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setUserRating(ratingVal)}
                    />
                  </label>
                );
              })}
            </div>
            <p>Your Rating: {userRating}/10</p>

            <textarea
              placeholder="Leave a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="comment-input"
              rows={3}
            />
            <button className="submit-rating-btn" onClick={handleSubmitRating}>
              Submit
            </button>
          </div>
        </div>
      )}

      <div className="background-blur" style={{ backgroundImage: `url(${data.poster_url})` }}></div>

      <div className="extras">
        <h2 className="section-title">{type} Cast</h2>
        <div className="people-grid">
          {(data.cast || []).map(person => (
            <div className="person-card" key={person.person_id}>
              <PersonImage src={person.profile_img_url} alt={person.name} />
              <h4>{person.name}</h4>
              <p className="role">{person.character_name}</p>
            </div>
          ))}
        </div>

        <h2 className="section-title">{type} Crew</h2>
        <div className="people-grid">
          {(data.crew || []).map(person => (
            <div className="person-card" key={person.person_id}>
              <PersonImage src={person.profile_img_url} alt={person.name} />
              <h4>{person.name}</h4>
              <p className="role">{person.role}</p>
            </div>
          ))}
        </div>

        {/* Star Rating Bar Chart Section - Now visible for both movies and series */}
        {totalReviewCount > 0 && (
          <>
            <h2 className="section-title">Star Ratings</h2>
            <div className="star-rating-chart-container">
              <div className="star-rating-chart">
                {starRatingCounts.map(({ rating, count }) => (
                  <div
                    key={rating}
                    className={`bar-container ${selectedRating === rating ? 'active' : ''}`}
                    onClick={() => handleBarClick(rating)}
                    onMouseEnter={() => handleBarMouseEnter(rating)}
                    onMouseLeave={handleBarMouseLeave}
                  >
                    <span className="rating-label">{rating}</span>
                    <div className="bar-wrapper">
                      <div
                        className="bar"
                        style={{ height: maxCount > 0 ? `${(count / maxCount) * 100}%` : '0%' }}
                      ></div>
                    </div>
                    <span className="count-label">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <h2 className="section-title">User Comments</h2>
        {commentsWithContent.length > 0 ? (
          <div className="comments-scroll-container">
            <button
              className="scroll-arrow left"
              onClick={() => commentScrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
            >
              ←
            </button>
            <div className="comment-scroll-container" ref={commentScrollRef}>
              {commentsWithContent
                .map((review) => {
                  const reviewRating = parseInt(review.rating);
                  const isFaded =
                    (selectedRating !== null && reviewRating !== selectedRating) ||
                    (selectedRating === null && hoveredChartRating !== null && reviewRating !== hoveredChartRating);
                  return (
                    <CommentCard
                      key={review.review_id}
                      review={review}
                      isFaded={isFaded}
                    />
                  );
                })}
            </div>
            <button
              className="scroll-arrow right"
              onClick={() => commentScrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
            >
              →
            </button>
          </div>
        ) : (
          <p style={{ color: "#aaa", paddingLeft: "1rem" }}>
            {selectedRating !== null ? `No comments for ${selectedRating} stars.` : `No comments yet. Be the first to review this ${type}!`}
          </p>
        )}

        {/* Episodes Section */}
{type === 'series' && data.seasons && data.seasons.length > 0 && (
  <>
    <h2 className="section-title">
      Episodes ({data.seasons.reduce((acc, s) => acc + (s.episodes ? s.episodes.length : 0), 0)})
    </h2>
    <div className="top-episodes">
      {data.seasons
        .flatMap(s => s.episodes || [])
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 2)
        .map(ep => (
          <div key={ep.episode_id} className="top-episode">
            <strong>Episode {ep.episode_number}: {ep.title}</strong>
            {ep.rating && <span className="episode-rating">⭐ {ep.rating}</span>}
          </div>
        ))}
    </div>
    <button
      className="view-episodes-btn"
      onClick={() => navigate(`/series/${id}/episodes`)}
    >
      View All Episodes
    </button>
  </>
)}

      </div>
    </div>
  );
};

export default Details;