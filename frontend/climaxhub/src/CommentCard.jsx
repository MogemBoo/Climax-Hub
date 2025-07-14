import React, { useState } from "react";

const CommentCard = ({ review }) => {
  const [expanded, setExpanded] = useState(false);
  const isLongComment = review.comments && review.comments.length > 150;

  return (
    <div className="comment-card">
      <h4 className="comment-username">👤 {review.username}</h4>
      <p className="comment-rating">⭐ {review.rating}/10</p>

      <p
        className={`comment-text ${expanded ? "expanded" : ""}`}
        title={expanded ? "" : review.comments}
      >
        {review.comments}
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

      <p className="comment-date">
        {new Date(review.created_at).toLocaleDateString('en-US')}
      </p>
    </div>
  );
};

export default CommentCard;
