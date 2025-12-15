import { useState } from "react";
import { updateProfile } from "../../services/profileService";
import { fileToBase64 } from "../../utils/helpers";
import { styles } from "../../utils/helpers";

export default function ProfileEditModal({
  profile,
  onClose,
  onSave,
}) {
  const [name, setName] = useState(profile?.name || "");
  const [about, setAbout] = useState(profile?.about || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(
    profile?.photoURL || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError("Foto deve ter menos de 1MB");
      return;
    }

    setPhotoFile(file);
    const preview = await fileToBase64(file);
    setPhotoPreview(preview);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    setIsLoading(true);

    try {
      await updateProfile(profile?.uid, {
        name: name.trim(),
        about: about.trim(),
        photoURL: photoPreview,
      });

      onSave?.({
        name,
        about,
        photoURL: photoPreview,
      });

      onClose();
    } catch (err) {
      setError(err.message || "Erro ao atualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 20,
          maxWidth: 400,
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2>Editar Perfil</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "#fee",
              color: "#c00",
              padding: 10,
              borderRadius: 4,
              marginBottom: 15,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", marginBottom: 5 }}>
              Foto de Perfil
            </label>
            {photoPreview && (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: photoPreview,
                  backgroundSize: "cover",
                  marginBottom: 10,
                  border: "2px solid #007bff",
                }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ ...styles.input, marginBottom: 10 }}
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", marginBottom: 5 }}>
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              disabled={isLoading}
              placeholder="Seu nome"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 5 }}>
              Biografia
            </label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              style={{
                ...styles.input,
                minHeight: 80,
                fontFamily: "inherit",
              }}
              disabled={isLoading}
              placeholder="Conte algo sobre você..."
              maxLength={200}
            />
            <small style={{ color: "#999" }}>
              {about.length}/200
            </small>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...styles.button,
                flex: 1,
                background: "#ddd",
                color: "#333",
              }}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                ...styles.button,
                flex: 1,
                opacity: isLoading ? 0.6 : 1,
              }}
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
