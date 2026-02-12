/**
 * PostForm.jsx - Form to create posts with attachments
 */

import { useState } from "react";
import { createPost } from "../../services/postsService";
import { fileToBase64, validateFileSize, styles } from "../../utils/helpers";

export default function PostForm({ userId, userEmail, onPostCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 1MB for Base64 in Firestore)
    if (!validateFileSize(file.size, 1)) {
      setError("File too large (max 1MB)");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64,
      });

      // Preview for images
      if (file.type.startsWith("image/")) {
        setPreview(base64);
      }

      setError("");
    } catch (err) {
      setError("Error processing file");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !userId) {
      setError("Fill in title and content");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await createPost({
        title,
        content,
        authorId: userId,
        authorEmail: userEmail,
        attachment: attachment || null,
      });

      setTitle("");
      setContent("");
      setAttachment(null);
      setPreview(null);
      onPostCreated?.();
    } catch (err) {
      console.error("Error creating post:", err);
      setError(err.message || "Error publishing post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#f9f9f9",
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
      }}
    >
      <h3>New Post</h3>

      {error && (
        <div
          style={{
            background: "#fee",
            color: "#c00",
            padding: 10,
            borderRadius: 4,
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={styles.input}
        disabled={isLoading}
      />

      <textarea
        placeholder="Write your post..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          ...styles.textarea,
          minHeight: 120,
        }}
        disabled={isLoading}
      />

      {/* Attachment input */}
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="file-input">
          📎 Attach file (max 1MB):
        </label>
        <input
          id="file-input"
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          disabled={isLoading}
          style={{ marginLeft: 10 }}
        />
      </div>

      {/* Image preview */}
      {preview && (
        <div style={{ marginBottom: 10 }}>
          <img
            src={preview}
            alt="preview"
            style={{
              maxWidth: 200,
              maxHeight: 200,
              borderRadius: 4,
              marginBottom: 8,
            }}
          />
          <button
            type="button"
            onClick={() => {
              setAttachment(null);
              setPreview(null);
            }}
            style={{
              ...styles.buttonDanger,
              marginRight: 8,
            }}
          >
            Remove Image
          </button>
        </div>
      )}

      {/* File info */}
      {attachment && !preview && (
        <div
          style={{
            marginBottom: 10,
            padding: 8,
            background: "#e8f5e9",
            borderRadius: 4,
          }}
        >
          📎 {attachment.name} (
          {(attachment.size / 1024).toFixed(2)}KB)
          <button
            type="button"
            onClick={() => {
              setAttachment(null);
              setPreview(null);
            }}
            style={{
              marginLeft: 10,
              background: "transparent",
              border: "none",
              color: "red",
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        style={{
          ...styles.button,
          opacity: isLoading ? 0.6 : 1,
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "Publishing..." : "Publish"}
      </button>
    </div>
  );
}
