/**
 * PostCard.jsx - Cartão individual de post - COMPLETO
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
        setError("Você já curtiu este post");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja apagar este post?"))
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
          title="Deletar post"
        >
          🗑️
        </button>
      )}

      {/* ✅ Dados completos do autor */}
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
          {/* ✅ Nome clicável */}
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

          {/* ✅ NOVO: Data do post + Membro desde */}
          <div style={{ fontSize: 12, color: "#999" }}>
            {formatDate(post.createdAt)}

            
          </div>
        </div>
      </div>

      <h4>{post.title}</h4>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {linkify(post.content)}
      </p>

      {/* Anexo */}
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
              alt="anexo"
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
        ❤️ Curtir
      </button>
      <span style={{ marginLeft: 10, fontSize: 14, color: "#666" }}>
        {post.likes || 0} curtidas
      </span>

      {/* ✅ Passa onAuthorClick */}
      <CommentSection 
        post={post} 
        currentUserId={currentUserId} 
        onAuthorClick={onAuthorClick}
      />
    </div>
  );
}