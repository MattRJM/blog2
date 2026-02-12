/**
 * PostCard.jsx - Individual post card - FULL
 */

import { useState } from "react";
import { deletePost, likePost } from "../../services/postsService";
import { generateAvatar, linkify, formatDate, styles } from "../../utils/helpers";
import CommentSection from "./CommentSection";

export default function PostCard({
  post,
  currentUserId,
  onAuthorClick,
  onPostDeleted,
}) {
  const [isLiking, setIsLiking] = useState(false);
  const [error, setError] = useState("");

  const isOwnPost = currentUserId === post.authorId;

  const handleLike = async () => {
    if (!currentUserId) return;

    setIsLiking(true);
    setError("");

    try {
      const success = await likePost(post.id, currentUserId);
      if (!success) {
        setError("You have already liked this post");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?"))
      return;

    try {
      await deletePost(post.id);
      onPostDeleted?.(post.id);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ ...styles.card, position: "relative" }}>
      {isOwnPost && (
        <button
          onClick={handleDelete}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "transparent",
            border: "none",
            color: "red",
            fontSize: 18,
            cursor: "pointer",
          }}
          title="Delete post"
        >
          🗑️
        </button>
      )}

      {/* ✅ Full author data */}
      <div
        onClick={() => {
          const authorData = post.authorData || {
            uid: post.authorId,
            name: post.authorName,
            email: post.authorEmail,
            photoURL: post.authorPhoto,
            about: "",
            subscribers: [],
          };
          onAuthorClick(authorData);
        }}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 15,
        }}
      >
        {generateAvatar(
          post.authorName || post.authorEmail,
          post.authorPhoto,
          50
        )}
        <div>
          {/* ✅ Clickable name */}
          <strong
            onClick={(e) => {
              e.stopPropagation();
              const authorData = post.authorData || {
                uid: post.authorId,
                name: post.authorName,
                email: post.authorEmail,
                photoURL: post.authorPhoto,
                about: "",
                subscribers: [],
              };
              onAuthorClick(authorData);
            }}
            style={{
              cursor: "pointer",
              textDecoration: "underline",
              color: "#007bff",
            }}
          >
            {post.authorName || post.authorEmail}
          </strong>

          {/* ✅ NEW: Post date + Member since */}
          <div style={{ fontSize: 12, color: "#999" }}>
            {formatDate(post.createdAt)}
          </div>
        </div>
      </div>

      <h4>{post.title}</h4>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {linkify(post.content)}
      </p>

      {/* Attachment */}
      {post.attachment && (
        <div
          style={{
            marginTop: 10,
            marginBottom: 10,
            padding: 10,
            background: "#f5f5f5",
            borderRadius: 4,
          }}
        >
          {post.attachment.type.startsWith("image/") ? (
            <img
              src={post.attachment.data}
              alt="attachment"
              style={{
                maxWidth: "100%",
                maxHeight: 300,
                borderRadius: 4,
              }}
            />
          ) : (
            <a
              href={post.attachment.data}
              download={post.attachment.name}
              style={{ color: "blue" }}
            >
              📎 {post.attachment.name}
            </a>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#fee",
            color: "#c00",
            padding: 8,
            borderRadius: 4,
            marginBottom: 10,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleLike}
        disabled={isLiking}
        style={{
          background: "transparent",
          border: "none",
          cursor: isLiking ? "not-allowed" : "pointer",
          fontSize: 16,
          opacity: isLiking ? 0.6 : 1,
        }}
      >
        ❤️ Like
      </button>
      <span style={{ marginLeft: 10, fontSize: 14, color: "#666" }}>
        {post.likes || 0} likes
      </span>

      {/* ✅ Pass onAuthorClick */}
      <CommentSection 
        post={post} 
        currentUserId={currentUserId} 
        onAuthorClick={onAuthorClick}
      />
    </div>
  );
}
