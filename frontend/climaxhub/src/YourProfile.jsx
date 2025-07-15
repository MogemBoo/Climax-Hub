import React, { useEffect, useState } from "react";
import "./YourProfile.css";

const YourProfile = () => {
  const [user, setUser] = useState(null);
  const [showPostPopup, setShowPostPopup] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewContent, setEditReviewContent] = useState("");

  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");

  const [expandedReviews, setExpandedReviews] = useState({});

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
      loadUser();
    } catch (err) {
      alert("Error adding post: " + err.message);
    }
  };

  const handleSaveReview = async (reviewId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editReviewContent }),
      });
      if (!res.ok) throw new Error("Failed to update review");
      alert("Review updated successfully!");
      setEditingReviewId(null);
      loadUser();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSavePost = async (postId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editPostTitle, content: editPostContent }),
      });
      if (!res.ok) throw new Error("Failed to update post");
      alert("Post updated successfully!");
      setEditingPostId(null);
      loadUser();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!user) return <div className="profile-loader">Loading Profile...</div>;

  return (
    <div className="profile-container">
      <h1 className="profile-title">{user.username}'s Profile</h1>
      <p className="profile-joined">
        Joined: {new Date(user.created_at).toLocaleDateString()}
      </p>

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
          <div>
            {user.reviews
              .filter((rev) => rev.content && rev.content.trim() !== "")
              .map((rev) => {
                const isLong = rev.content.length > 300;
                const isExpanded = expandedReviews[rev.review_id];

                return (
                  <div key={rev.review_id} className="profile-card">
                    {editingReviewId === rev.review_id ? (
                      <>
                        <input
                          type="text"
                          className="edit-input"
                          value={rev.title}
                          disabled
                        />
                        <textarea
                          className="edit-textarea"
                          value={editReviewContent}
                          onChange={(e) => setEditReviewContent(e.target.value)}
                          rows={4}
                        />
                        <div className="popup-buttons" style={{ marginTop: "0.5rem" }}>
                          <button
                            className="popup-submit"
                            onClick={() => handleSaveReview(rev.review_id)}
                          >
                            Save
                          </button>
                          <button
                            className="popup-cancel"
                            onClick={() => setEditingReviewId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <strong>{rev.title}</strong> {" "}
                        <span className="review-content">
                          {isLong && !isExpanded
                            ? rev.content.slice(0, 300) + "..."
                            : rev.content}
                        </span>

                        {isLong && (
                          <button
                            className="see-more-btn"
                            onClick={() =>
                              setExpandedReviews((prev) => ({
                                ...prev,
                                [rev.review_id]: !isExpanded,
                              }))
                            }
                          >
                            {isExpanded ? "See Less" : "See More"}
                          </button>
                        )}
                        <button
                          className="edit-btn"
                          onClick={() => {
                            setEditingReviewId(rev.review_id);
                            setEditReviewContent(rev.content);
                          }}
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
          </div>
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
          <div>
            {user.posts.map((post) => (
              <div key={post.post_id} className="profile-card">
                {editingPostId === post.post_id ? (
                  <>
                    <input
                      className="edit-input"
                      value={editPostTitle}
                      onChange={(e) => setEditPostTitle(e.target.value)}
                    />
                    <textarea
                      className="edit-textarea"
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      rows={4}
                    />
                    <div className="popup-buttons" style={{ marginTop: "0.5rem" }}>
                      <button
                        className="popup-submit"
                        onClick={() => handleSavePost(post.post_id)}
                      >
                        Save
                      </button>
                      <button
                        className="popup-cancel"
                        onClick={() => setEditingPostId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <strong>{post.title}</strong> {post.content}
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditingPostId(post.post_id);
                        setEditPostTitle(post.title);
                        setEditPostContent(post.content);
                      }}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
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
