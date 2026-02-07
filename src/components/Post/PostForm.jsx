/**
 * PostForm.jsx - Formulário para criar posts seguros para Firestore
 */

import { useState } from "react";
import { createPost } from "../../services/postsService";
import { fileToBase64, styles } from "../../utils/helpers";

const MAX_DOC_SIZE = 1024 * 1024; // 1MB

export default function PostForm({ userId, userEmail, onPostCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================
  // Seleção de arquivo
  // =====================
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limitar tamanho máximo do arquivo em bytes
    if (file.size > 1024 * 1024) {
      setError("Arquivo muito grande (máx 1MB)");
      return;
    }

    try {
      const base64 = await fileToBase64(file);

      // Checar tamanho aproximado do post incluindo attachment
      const testPost = JSON.stringify({
        title,
        content,
        attachment: { name: file.name, type: file.type, data: base64 },
      });
      if (new Blob([testPost]).size > MAX_DOC_SIZE) {
        setError("Arquivo + conteúdo excedem 1MB, escolha algo menor");
        return;
      }

      setAttachment({
        name: file.name,
        type: file.type,
        data: base64,
      });

      if (file.type.startsWith("image/")) {
        setPreview(base64);
      }

      setError("");
    } catch {
      setError("Erro ao processar arquivo");
    }
  };

  // =====================
  // Publicar post
  // =====================
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !userId) {
      setError("Preencha título e conteúdo");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Criar objeto do post sem campos vazios
      const postData = {
        title: title.trim(),
        content: content.trim(),
        authorId: userId,
        authorEmail: userEmail,
        ...(attachment ? { attachment } : {}),
      };

      // Checar tamanho aproximado
      const size = new Blob([JSON.stringify(postData)]).size;
      if (size > MAX_DOC_SIZE) {
        setError("Post muito grande (máx 1MB)");
        setIsLoading(false);
        return;
      }

      await createPost(postData);

      setTitle("");
      setContent("");
      setAttachment(null);
      setPreview(null);
      onPostCreated?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao publicar post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: "#f9f9f9", padding: 15, borderRadius: 8, marginBottom: 20 }}>
      <h3>Novo Post</h3>

      {error && (
        <div style={{ background: "#fee", color: "#c00", padding: 10, borderRadius: 4, marginBottom: 10 }}>
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
        style={{ ...styles.textarea, minHeight: 120 }}
        disabled={isLoading}
      />

      <div style={{ marginBottom: 10 }}>
        <label htmlFor="file-input">📎 Anexar arquivo (máx 1MB):</label>
        <input
          id="file-input"
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          disabled={isLoading}
          style={{ marginLeft: 10 }}
        />
      </div>

      {preview && (
        <div style={{ marginBottom: 10 }}>
          <img src={preview} alt="preview" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 4, marginBottom: 8 }} />
          <button type="button" onClick={() => { setAttachment(null); setPreview(null); }} style={{ ...styles.buttonDanger, marginRight: 8 }}>
            Remover Imagem
          </button>
        </div>
      )}

      {attachment && !preview && (
        <div style={{ marginBottom: 10, padding: 8, background: "#e8f5e9", borderRadius: 4 }}>
          📎 {attachment.name} <button type="button" onClick={() => { setAttachment(null); setPreview(null); }} style={{ marginLeft: 10, background: "transparent", border: "none", color: "red", cursor: "pointer" }}>Remover</button>
        </div>
      )}

      <button onClick={handleSubmit} disabled={isLoading} style={{ ...styles.button, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}>
        {isLoading ? "Publicando..." : "Publicar"}
      </button>
    </div>
  );
}
