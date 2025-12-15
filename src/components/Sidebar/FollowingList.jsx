import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { generateAvatar } from "../../utils/helpers";

export default function FollowingList({
  followingList = [],
  onProfileClick,
  onMessageClick,
}) {
  const [followingUsers, setFollowingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribers, setUnsubscribers] = useState({});

  useEffect(() => {
    if (!followingList || followingList.length === 0) {
      // ✅ Limpar listeners antigos quando lista fica vazia
      Object.values(unsubscribers).forEach((unsub) => unsub?.());
      setUnsubscribers({});
      setFollowingUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // ✅ NOVO: Rastrear qual usuários tinha antes
      const followingListSet = new Set(followingList);
      const previousUserIds = new Set(Object.keys(unsubscribers));

      // ✅ REMOVER listeners de usuários que saíram da lista
      previousUserIds.forEach((userId) => {
        if (!followingListSet.has(userId)) {
          // Usuário foi removido da lista
          unsubscribers[userId]?.();
          delete unsubscribers[userId];

          // Remover do estado
          setFollowingUsers((prev) => prev.filter((u) => u.uid !== userId));
        }
      });

      // ✅ ADICIONAR listeners para novos usuários
      const newUnsubscribers = { ...unsubscribers };

      followingList.forEach((userId) => {
        // Se já tem listener, pular
        if (newUnsubscribers[userId]) return;

        const userRef = doc(db, "users", userId);

        const unsub = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setFollowingUsers((prev) => {
              // Remover versão antiga
              const updated = prev.filter((u) => u.uid !== userId);
              // Adicionar versão nova
              return [
                ...updated,
                {
                  uid: userId,
                  ...snapshot.data(),
                },
              ].sort((a, b) =>
                (a.name || a.email).localeCompare(b.name || b.email)
              );
            });
          }
        });

        newUnsubscribers[userId] = unsub;
      });

      setUnsubscribers(newUnsubscribers);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao buscar lista de seguindo:", err);
      setLoading(false);
    }

    // Cleanup - unsubscribe de todos quando componente unmount
    return () => {
      Object.values(unsubscribers).forEach((unsub) => unsub?.());
    };
  }, [followingList]);

  if (loading && followingUsers.length === 0) {
    return (
      <div style={{ padding: 10, color: "#999" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div
      style={{
        width: 280,
        background: "#f9f9f9",
        borderLeft: "1px solid #ddd",
        padding: 15,
        maxHeight: "calc(100vh - 100px)",
        overflowY: "auto",
      }}
    >
      <h3 style={{ margin: "0 0 15px 0" }}>
        👥 Seguindo ({followingUsers.length})
      </h3>

      {followingUsers.length === 0 ? (
        <p style={{ color: "#999", fontSize: 12 }}>
          Você não segue ninguém ainda.
        </p>
      ) : (
        followingUsers.map((user) => (
          <div
            key={user.uid}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 10,
              marginBottom: 8,
              background: "#fff",
              borderRadius: 4,
              cursor: "pointer",
              borderLeft: "3px solid transparent",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f0f0f0";
              e.currentTarget.style.borderLeftColor = "#007bff";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderLeftColor = "transparent";
            }}
          >
            <div
              onClick={() => onProfileClick?.(user)}
              style={{ flex: 1, cursor: "pointer" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {generateAvatar(
                  user.name || user.email,
                  user.photoURL,
                  32
                )}
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.name || user.email}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#999",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
  e.stopPropagation();
  onMessageClick?.(user.uid, user);
}}

              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                padding: 4,
              }}
              title="Enviar mensagem"
            >
              💬
            </button>
          </div>
        ))
      )}
    </div>
  );
}