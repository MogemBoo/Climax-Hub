import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./YourRating.css";

const YourRatings = () => {
    const [ratings, setRatings] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            navigate("/login");
            return;
        }

        fetch(`http://localhost:5000/api/rating/ratings/${user.user_id}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setRatings(data);
                } else {
                    console.error("Unexpected API response:", data);
                    setRatings([]);
                }
            })
            .catch((err) => {
                console.error("Failed to fetch ratings:", err);
                setRatings([]);
            });
    }, [navigate]);

    const renderStars = (rating) => {
        const maxStars = 10;
        return Array.from({ length: maxStars }, (_, i) => (
            <span key={i} className={`star ${i < rating ? "filled" : ""}`}>
                ★
            </span>
        ));
    };

    return (
        <div className="ratings-container">
            <h1 className="ratings-title">Your Ratings</h1>
            {ratings.length === 0 ? (
                <p className="ratings-empty">You haven't rated anything yet.</p>
            ) : (
                <div className="ratings-grid">
                    {ratings.map((item) => {
                        const id = item.type === "movie" ? item.movie_id : item.series_id;
                        const url = item.type === "movie" ? `/details/movies/${id}` : `/details/series/${id}`;
                        return (
                            <div
                                key={`${item.type}-${id}`}
                                className="ratings-card"
                                onClick={() => navigate(url)}
                            >
                                <img
                                    src={item.poster_url}
                                    alt={item.title}
                                    className="ratings-poster"
                                    onError={(e) => { e.target.src = "/fallback.jpg"; }}
                                />
                                <div className="ratings-info">
                                    <h3>{item.title}</h3>
                                    <div className="stars-container">{renderStars(item.rating)}</div>
                                    {item.comments && (
                                        <div className="ratings-comment-box">
                                            <p className="ratings-comment">"{item.comments}"</p>
                                        </div>
                                    )}
                                    <p className="ratings-date">
                                        Rated on: {new Date(item.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default YourRatings;
