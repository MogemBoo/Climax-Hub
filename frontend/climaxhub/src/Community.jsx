import React, { useEffect, useState } from "react";
import "./Community.css";

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [showCommentForm, setShowCommentForm] = useState({});
  const [user, setUser] = useState(null);
  const [modalPost, setModalPost] = useState(null);
  const [modalComments, setModalComments] = useState([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);

    fetch(`http://localhost:5000/api/posts?user_id=${userData?.user_id || 0}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load posts");
        setLoading(false);
      });
  }, []);

  const handleVote = async (postId, type) => {
    if (!user) return alert("Please login to vote");
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, vote_type: type }),
      });
      if (!res.ok) throw new Error("Failed to vote");
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.post_id === postId
            ? { ...p, upvote: data.upvote, downvote: data.downvote, user_vote: data.user_vote }
            : p
        )
      );
      if (modalPost && modalPost.post_id === postId) {
        setModalPost((prev) => ({
          ...prev,
          upvote: data.upvote,
          downvote: data.downvote,
          user_vote: data.user_vote,
        }));
      }
    } catch (err) {
      alert("Failed to vote: " + err.message);
    }
  };

  const handleCommentSubmit = async (postId) => {
    if (!user) return alert("Please login to comment");
    const commentText = commentTexts[postId];
    if (!commentText?.trim()) return alert("Please enter a comment");

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, content: commentText }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      const newComment = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.post_id === postId
            ? { ...p, comments: [newComment, ...(p.comments || [])].slice(0, 3) }
            : p
        )
      );
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      setShowCommentForm((prev) => ({ ...prev, [postId]: false }));
    } catch (err) {
      alert("Failed to add comment: " + err.message);
    }
  };

  const toggleCommentForm = (postId) => {
    setShowCommentForm((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const openCommentsModal = async (post) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${post.post_id}/comments`);
      if (!res.ok) throw new Error("Failed to load comments");
      const comments = await res.json();
      setModalPost(post);
      setModalComments(comments);
    } catch {
      alert("Failed to load comments");
    }
  };

  const closeModal = () => {
    setModalPost(null);
    setModalComments([]);
  };

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
          const showCommentFormForPost = showCommentForm[post.post_id];
          const commentText = commentTexts[post.post_id] || "";

          return (
            <div className="community-post-card" key={idx}>
              <div className="community-post-username">
                <img src={post.pfp || "/person.jpg"} alt="User" className="pfp-img" />
                {post.username}
              </div>
              <div className="community-post-title">{post.title}</div>
              <div className="community-post-content">
                {isLong && !expanded ? post.content.slice(0, 250) + "..." : post.content}
              </div>
              {isLong && (
                <button
                  className="see-more-btn"
                  onClick={() =>
                    setExpandedPosts((prev) => ({ ...prev, [idx]: !expanded }))
                  }
                >
                  {expanded ? "See less" : "See more"}
                </button>
              )}

              {/* Voting Section */}
              <div className="post-voting">
                <button
                  className={`vote-btn upvote-btn ${post.user_vote === 1 ? "active" : ""}`}
                  onClick={() => handleVote(post.post_id, 1)}
                >
                  👍 {post.upvote}
                </button>
                <button
                  className={`vote-btn downvote-btn ${post.user_vote === -1 ? "active" : ""}`}
                  onClick={() => handleVote(post.post_id, -1)}
                >
                  👎 {post.downvote}
                </button>
              </div>

              {/* Comments Section */}
              <div className="post-comments">
                <button
                  className="comment-toggle-btn"
                  onClick={() => toggleCommentForm(post.post_id)}
                >
                  💬 Comment
                </button>

                {showCommentFormForPost && (
                  <div className="comment-form">
                    <textarea
                      value={commentText}
                      onChange={(e) =>
                        setCommentTexts((prev) => ({
                          ...prev,
                          [post.post_id]: e.target.value,
                        }))
                      }
                      placeholder="Write your comment..."
                      className="comment-textarea"
                    />
                    <div className="comment-form-buttons">
                      <button
                        className="comment-submit-btn"
                        onClick={() => handleCommentSubmit(post.post_id)}
                      >
                        Submit
                      </button>
                      <button
                        className="comment-cancel-btn"
                        onClick={() => {
                          setShowCommentForm((prev) => ({
                            ...prev,
                            [post.post_id]: false,
                          }));
                          setCommentTexts((prev) => ({
                            ...prev,
                            [post.post_id]: "",
                          }));
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {post.comments?.length > 0 && (
                  <div className="comments-list">
                    {post.comments.map((comment, commentIdx) => (
                      <div key={commentIdx} className="comment-item">
                        <div className="comment-username">
                          <img
                            src={comment.pfp || "/person.jpg"}
                            alt="User"
                            className="pfp-img"
                          />
                          {comment.username}
                        </div>
                        <div className="comment-content">{comment.content}</div>
                        <div className="comment-date">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {post.comments.length >= 3 && (
                      <button
                        className="see-more-btn"
                        onClick={() => openCommentsModal(post)}
                      >
                        See all comments
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalPost && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} // prevent closing on content click
          >
            <div className="modal-header">
              <div className="modal-username">
                <img
                  src={modalPost.pfp || "/person.jpg"}
                  alt="User"
                  className="pfp-img"
                />
                {modalPost.username}
              </div>
              <div className="modal-title">{modalPost.title}</div>
            </div>
            <div className="modal-body">
              <p className="modal-post-content">{modalPost.content}</p>
              <div className="modal-voting">
                <button
                  className={`vote-btn upvote-btn ${modalPost.user_vote === 1 ? "active" : ""}`}
                  onClick={() => handleVote(modalPost.post_id, 1)}
                >
                  👍 {modalPost.upvote}
                </button>
                <button
                  className={`vote-btn downvote-btn ${modalPost.user_vote === -1 ? "active" : ""}`}
                  onClick={() => handleVote(modalPost.post_id, -1)}
                >
                  👎 {modalPost.downvote}
                </button>
              </div>
              <div className="modal-comments">
                {modalComments.map((comment, idx) => (
                  <div key={idx} className="comment-item">
                    <div className="comment-username">
                      <img
                        src={comment.pfp || "/person.jpg"}
                        alt="User"
                        className="pfp-img"
                      />
                      {comment.username}
                    </div>
                    <div className="comment-content">{comment.content}</div>
                    <div className="comment-date">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="modal-close-btn" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
