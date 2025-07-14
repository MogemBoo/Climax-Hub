import React, { useEffect, useState } from "react";
import "./YourProfile.css";

const YourProfile = () => {
  const [user, setUser] = useState(null);
  const [showPostPopup, setShowPostPopup] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  const loadUser = () => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      fetch(`http://localhost:5000/api/users/${parsed.user_id}`)
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch((err) => console.error("Error loading user profile", err));
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleAddPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert("Title and content are required.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          title: newPostTitle,
          content: newPostContent,
        }),
      });

      if (!res.ok) throw new Error("Failed to post");

      alert("Post added successfully!");
      setShowPostPopup(false);
      setNewPostTitle("");
      setNewPostContent("");
      loadUser(); // Reload user data
    } catch (err) {
      alert("Error adding post: " + err.message);
    }
  };

  if (!user) return <div className="profile-loader">Loading Profile...</div>;

  return (
    <div className="profile-container">
      <h1 className="profile-title">{user.username}'s Profile</h1>
      <p className="profile-joined">Joined: {new Date(user.created_at).toLocaleDateString()}</p>

      <div className="profile-section">
        <h2>Your Ratings</h2>
        {user.ratings?.length ? (
          <ul className="profile-list">
            {user.ratings.map((r, i) => (
              <li key={i} className="profile-item">
                {r.poster_url && (
                  <img src={r.poster_url} alt={r.title} className="poster-thumb" />
                )}
                <div>
                  ⭐ {r.score}/10 — <strong>{r.title}</strong> ({r.type})
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">You haven’t rated anything yet.</p>
        )}
      </div>

      <div className="profile-section">
        <h2>Your Watchlist</h2>
        {user.watchlist?.length ? (
          <ul className="profile-list">
            {user.watchlist.map((item, i) => (
              <li key={i} className="profile-item">
                {item.poster_url && (
                  <img src={item.poster_url} alt={item.title} className="poster-thumb" />
                )}
                <div>
                  📌 {item.title} ({item.type})
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">Your watchlist is empty.</p>
        )}
      </div>

      <div className="profile-section">
        <h2>Your Reviews</h2>
        {user.reviews?.length ? (
          <ul className="profile-list">
            {user.reviews.map((rev, i) => (
              <li key={i}>
                <strong>{rev.title}</strong> — {rev.content}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">You haven’t written any reviews yet.</p>
        )}
      </div>

      <div className="profile-section">
        <div className="post-header">
          <h2>Your Posts</h2>
          <button className="add-post-btn" onClick={() => setShowPostPopup(true)}>
            ➕ Add Post
          </button>
        </div>
        {user.posts?.length ? (
          <ul className="profile-list">
            {user.posts.map((post, i) => (
              <li key={i}>
                <strong>{post.title}</strong>: {post.content}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">You haven't posted anything yet.</p>
        )}
      </div>

      {showPostPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>Create New Post</h3>
            <input
              type="text"
              placeholder="Post title"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              className="popup-input"
            />
            <textarea
              placeholder="Write your content..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="popup-textarea"
              rows={5}
            />
            <div className="popup-buttons">
              <button className="popup-submit" onClick={handleAddPost}>
                Submit
              </button>
              <button className="popup-cancel" onClick={() => setShowPostPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YourProfile;
