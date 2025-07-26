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

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
    
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

  const handleUpvote = async (postId) => {
    if (!user) {
      alert("Please login to upvote posts");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id }),
      });

      if (!res.ok) throw new Error("Failed to upvote");
      
      // Update the post's upvote count locally
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.post_id === postId 
            ? { ...post, upvote: (post.upvote || 0) + 1 }
            : post
        )
      );
    } catch (err) {
      alert("Failed to upvote: " + err.message);
    }
  };

  const handleDownvote = async (postId) => {
    if (!user) {
      alert("Please login to downvote posts");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/downvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id }),
      });

      if (!res.ok) throw new Error("Failed to downvote");
      
      // Update the post's downvote count locally
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.post_id === postId 
            ? { ...post, downvote: (post.downvote || 0) + 1 }
            : post
        )
      );
    } catch (err) {
      alert("Failed to downvote: " + err.message);
    }
  };

  const handleCommentSubmit = async (postId) => {
    if (!user) {
      alert("Please login to comment");
      return;
    }

    const commentText = commentTexts[postId];
    if (!commentText?.trim()) {
      alert("Please enter a comment");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user.user_id, 
          content: commentText 
        }),
      });

      if (!res.ok) throw new Error("Failed to add comment");
      
      // Clear the comment text and hide the form
      setCommentTexts(prev => ({ ...prev, [postId]: "" }));
      setShowCommentForm(prev => ({ ...prev, [postId]: false }));
      
      // Refresh posts to get updated comments
      const postsRes = await fetch("http://localhost:5000/api/posts");
      const postsData = await postsRes.json();
      setPosts(postsData || []);
    } catch (err) {
      alert("Failed to add comment: " + err.message);
    }
  };

  const toggleCommentForm = (postId) => {
    setShowCommentForm(prev => ({ ...prev, [postId]: !prev[postId] }));
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
              
              {/* Voting Section */}
              <div className="post-voting">
                <button 
                  className="vote-btn upvote-btn"
                  onClick={() => handleUpvote(post.post_id)}
                  title="Upvote"
                >
                  👍 {post.upvote || 0}
                </button>
                <button 
                  className="vote-btn downvote-btn"
                  onClick={() => handleDownvote(post.post_id)}
                  title="Downvote"
                >
                  👎 {post.downvote || 0}
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
                      onChange={(e) => setCommentTexts(prev => ({ 
                        ...prev, 
                        [post.post_id]: e.target.value 
                      }))}
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
                          setShowCommentForm(prev => ({ ...prev, [post.post_id]: false }));
                          setCommentTexts(prev => ({ ...prev, [post.post_id]: "" }));
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Display existing comments */}
                {post.comments && post.comments.length > 0 && (
                  <div className="comments-list">
                    {post.comments.map((comment, commentIdx) => (
                      <div key={commentIdx} className="comment-item">
                        <div className="comment-username">{comment.username}</div>
                        <div className="comment-content">{comment.content}</div>
                        <div className="comment-date">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Community; 