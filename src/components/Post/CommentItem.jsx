import { generateAvatar, linkify } from "../../utils/helpers";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

export default function CommentItem({
  comment,
  onVote,
  currentUserId,
  onAuthorClick,
}) {
  const handleAuthorClick = async () => {
  try {
    // ✅ Buscar dados completos do autor
    const userRef = doc(db, "users", comment.authorId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      onAuthorClick?.({
        uid: comment.authorId,
        name: userData.name || comment.author,
        email: userData.email || "",
        photoURL: userData.photoURL || comment.authorPhoto,
        about: userData.about || "",
        subscribers: userData.subscribers || [],
        createdAt: userData.createdAt || null,  // ← NOVO: Passar createdAt
      });
    } else {
      // Fallback
      onAuthorClick?.({
        uid: comment.authorId,
        name: comment.author,
        email: "",
        photoURL: comment.authorPhoto,
        about: "",
        subscribers: [],
        createdAt: null,  // ← NOVO
      });
    }
  } catch (err) {
    console.error("Erro ao buscar perfil:", err);
    // Abrir com dados disponíveis
    onAuthorClick?.({
      uid: comment.authorId,
      name: comment.author,
      email: "",
      photoURL: comment.authorPhoto,
      about: "",
      subscribers: [],
      createdAt: null,  // ← NOVO
    });
  }
};


  return (
    <div
      style={{
        background: "#f5f5f5",
        padding: 10,
        marginBottom: 8,
        borderRadius: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {generateAvatar(comment.author, comment.authorPhoto, 32)}
        <div style={{ flex: 1 }}>
          {/* ✅ Nome clicável - busca perfil completo */}
          <strong
            onClick={handleAuthorClick}
            style={{
              cursor: "pointer",
              textDecoration: "underline",
              color: "#007bff",
            }}
          >
            {comment.author}
          </strong>

          {/* Email e data (se tiver) */}
          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
            {comment.createdAt && (
              <div>
                {new Date(
                  comment.createdAt?.seconds * 1000 ||
                    comment.createdAt
                ).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>

          <p style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>
            {linkify(comment.text)}
          </p>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => onVote("up")}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
            fontSize: 14,
          }}
        >
          ⬆️ {comment.upVotes?.length || 0}
        </button>
        <button
          onClick={() => onVote("down")}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
            marginLeft: 8,
            fontSize: 14,
          }}
        >
          ⬇️ {comment.downVotes?.length || 0}
        </button>
      </div>
    </div>
  );
}
