/**
 * Helpers e Utilitários
 */

/**
 * Gera avatar com iniciais ou imagem
 */
export const generateAvatar = (nameOrEmail, photoURL, size = 50) => {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt="avatar"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          marginRight: 10,
          objectFit: "cover",
        }}
      />
    );
  }

  const name = nameOrEmail || "";
  const initials = name
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const first = name.charCodeAt(0) || 65;
  const bgColor = `hsl(${(first * 15) % 360}, 60%, 70%)`;

  return (
    <div
      style={{
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: bgColor,
        color: "#fff",
        marginRight: 10,
        fontWeight: "bold",
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </div>
  );
};

/**
 * Transforma URLs em links clicáveis
 */
export const linkify = (text) => {
  if (!text) return text;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "blue", textDecoration: "underline" }}
        >
          {part}
        </a>
      );
    } else {
      return part;
    }
  });
};

/**
 * Formata data para string legível
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return "";
  try {
    return timestamp.toDate?.()?.toLocaleString?.() ?? "";
  } catch (err) {
    return "";
  }
};

/**
 * Valida email
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Converte arquivo para Base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Valida tamanho do arquivo
 */
export const validateFileSize = (fileSize, maxSizeMB = 1) => {
  return fileSize <= maxSizeMB * 1024 * 1024;
};

/**
 * Obtém nome do arquivo sem extensão
 */
export const getFileName = (fullName) => {
  return fullName.substring(0, fullName.lastIndexOf(".")) || fullName;
};

/**
 * Estilos globais reutilizáveis
 */
export const styles = {
  container: {
    maxWidth: 1200,
    margin: "auto",
    padding: 20,
    fontFamily: "Georgia",
    display: "flex",
    gap: 20,
  },
  mainContent: {
    flex: 1,
  },
  sidebar: {
    width: 250,
    background: "#fff",
    border: "1px solid #ddd",
    padding: 15,
    height: "fit-content",
    position: "sticky",
    top: 20,
  },
  button: {
    padding: "8px 12px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 14,
  },
  buttonDanger: {
    padding: "8px 12px",
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 14,
  },
  input: {
    width: "100%",
    padding: 8,
    marginBottom: 10,
    border: "1px solid #ddd",
    borderRadius: 4,
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    padding: 8,
    marginBottom: 10,
    border: "1px solid #ddd",
    borderRadius: 4,
    fontSize: 14,
    minHeight: 120,
  },
  card: {
    background: "#fff",
    padding: 15,
    border: "1px solid #ddd",
    marginBottom: 15,
    borderRadius: 4,
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  modalContent: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    width: 400,
  },
};

/**
 * Animações CSS globais
 */
export const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from { transform: scale(0.8); }
    to { transform: scale(1); }
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .fade-in { animation: fadeIn 0.3s ease-in-out; }
  .scale-in { animation: scaleIn 0.3s ease-in-out; }
  .slide-in { animation: slideIn 0.3s ease-in-out; }
`;