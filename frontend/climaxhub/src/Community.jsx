import React, { useEffect, useState } from "react";
import "./Community.css";

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});

  useEffect(() => {
    fetch("http://localhost:5000/api/posts")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load posts");
        setLoading(false);
      });
  }, []);

  return (
    <div className="community-container">
      <h1 className="community-title">Community</h1>
      {loading && <p>Loading posts...</p>}
      {error && <p className="community-error">{error}</p>}
      <div className="community-posts-list">
        {posts.length === 0 && !loading && !error && (
          <p className="community-empty">No posts yet.</p>
        )}
        {posts.map((post, idx) => {
          const isLong = post.content && post.content.length > 250;
          const expanded = expandedPosts[idx];
          return (
            <div className="community-post-card" key={idx}>
              <div className="community-post-username">{post.username}</div>
              <div className="community-post-title">{post.title}</div>
              <div className="community-post-content">
                {isLong && !expanded
                  ? post.content.slice(0, 250) + "..."
                  : post.content}
              </div>
              {isLong && (
                <button
                  className="see-more-btn"
                  onClick={() => setExpandedPosts((prev) => ({ ...prev, [idx]: !expanded }))}
                >
                  {expanded ? "See less" : "See more"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Community; 