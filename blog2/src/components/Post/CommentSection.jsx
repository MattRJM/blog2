/**
 * CommentSection.jsx - Seção de comentários do post
 */

import { useState } from "react";
import { addComment, voteComment } from "../../services/postsService";
import CommentItem from "./CommentItem";

export default function CommentSection({
  post,
  currentUserId,
  onCommentAdded,
  onAuthorClick,  // ← NOVO
}) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const orderedComments = [...(post.comments || [])]
    .sort(
      (a, b) =>
        ((b.upVotes?.length || 0) -
          (b.downVotes?.length || 0)) -
        ((a.upVotes?.length || 0) -
          (a.downVotes?.length || 0))
    );

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUserId) return;

    setIsLoading(true);
    setError("");

    try {
      // Você precisa passar o nome/foto do usuário
      // Isso deveria vir do contexto ou props
      await addComment({
        postId: post.id,
        userId: currentUserId,
        text: commentText,
        authorName: "Você",
        authorPhoto: "",
      });

      setCommentText("");
      onCommentAdded?.();
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (commentId, voteType) => {
    if (!currentUserId) return;

    try {
      await voteComment(post.id, commentId, voteType, post);
      onCommentAdded?.(); // Refresh
    } catch (err) {
      console.error("Erro ao votar:", err);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h5
        style={{ cursor: "pointer", color: "#007bff" }}
        onClick={() => setExpanded(!expanded)}
      >
        💬 Comentários ({post.comments?.length || 0})
      </h5>

      {expanded && (
        <>
          {orderedComments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              onVote={(voteType) =>
                handleVote(c.id, voteType)
              }
              onAuthorClick={onAuthorClick}
            />
          ))}

          {error && (
            <div
              style={{
                background: "#fee",
                color: "#c00",
                padding: 8,
                borderRadius: 4,
                marginBottom: 8,
              }}
            >
              {error}
            </div>
          )}

          <textarea
            placeholder="Escreva um comentário..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              marginTop: 8,
              marginBottom: 8,
              fontSize: 13,
              minHeight: 60,
              borderRadius: 4,
              border: "1px solid #ddd",
            }}
            disabled={isLoading}
          />

          <button
            onClick={handleAddComment}
            disabled={isLoading || !commentText.trim()}
            style={{
              padding: "6px 12px",
              background: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: isLoading
                ? "not-allowed"
                : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Enviando..." : "Comentar"}
          </button>
        </>
      )}
    </div>
  );
}
