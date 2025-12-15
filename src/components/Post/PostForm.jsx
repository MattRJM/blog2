/**
 * PostForm.jsx - Formulário para criar posts com anexos
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

    // Validar tamanho (máx 1MB para Base64 no Firestore)
    if (!validateFileSize(file.size, 1)) {
      setError("Arquivo muito grande (máx 1MB)");
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

      // Preview para imagens
      if (file.type.startsWith("image/")) {
        setPreview(base64);
      }

      setError("");
    } catch (err) {
      setError("Erro ao processar arquivo");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !userId) {
      setError("Preencha título e conteúdo");
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
      console.error("Erro ao criar post:", err);
      setError(err.message || "Erro ao publicar post");
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
      <h3>Novo Post</h3>

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
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={styles.input}
        disabled={isLoading}
      />

      <textarea
        placeholder="Escreva seu post..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          ...styles.textarea,
          minHeight: 120,
        }}
        disabled={isLoading}
      />

      {/* Input de anexo */}
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="file-input">
          📎 Anexar arquivo (máx 1MB):
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

      {/* Preview da imagem */}
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
            Remover Imagem
          </button>
        </div>
      )}

      {/* Info do arquivo */}
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
            Remover
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
        {isLoading ? "Publicando..." : "Publicar"}
      </button>
    </div>
  );
}