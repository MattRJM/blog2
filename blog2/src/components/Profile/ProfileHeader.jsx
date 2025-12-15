import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { generateAvatar, formatDate, styles } from "../../utils/helpers";

export default function ProfileHeader({
  profile,
  currentUserId,
  isOwnProfile,
  onEditClick,
  onSubscribeClick,
  onMessageClick,
  posts,
}) {
  const [isSubscribed, setIsSubscribed] = useState(
    profile?.subscribers?.includes(currentUserId) || false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(profile);

  // ✅ LISTENER em tempo real para dados do perfil (FORA do if!)
  useEffect(() => {
    if (!profileData?.uid) return;

    const userRef = doc(db, "users", profileData.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfileData({
          uid: profileData.uid,
          ...snapshot.data(),
        });
        // Atualizar isSubscribed se mudar
        setIsSubscribed(
          snapshot.data().subscribers?.includes(currentUserId) || false
        );
      }
    });

    return () => unsubscribe();
  }, [profileData?.uid, currentUserId]);

  if (!profileData)
    return <div style={{ padding: 20 }}>Carregando perfil...</div>;

  const profileId = profileData.id || profileData.uid || profileData.authorId;

  // ✅ Contar posts usando o profileId correto
  const postCount = posts?.filter((p) => p.authorId === profileId)?.length || 0;
  const subscribersCount = profileData.subscribers?.length || 0;

  const handleSubscribe = async () => {
    if (!currentUserId || !profileId) {
      console.error("Dados faltando:", { currentUserId, profileId, profileData });
      alert("Erro: dados do usuário faltando - ID: " + profileId);
      return;
    }

    setIsLoading(true);

    try {
      const userRef = doc(db, "users", currentUserId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error("Usuário atual não encontrado");
        setIsLoading(false);
        return;
      }

      const currentUserData = userSnap.data();
      const currentSubscriptions = currentUserData.subscriptions || [];
      const profileRef = doc(db, "users", profileId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        console.error("Perfil não encontrado em:", profileId);
        setIsLoading(false);
        return;
      }

      const profileDataSnap = profileSnap.data();
      const profileSubscribers = profileDataSnap.subscribers || [];

      if (isSubscribed) {
        // ✅ DEIXAR DE SEGUIR
        const newSubscriptions = currentSubscriptions.filter(
          (id) => id !== profileId
        );
        await updateDoc(userRef, {
          subscriptions: newSubscriptions,
        });

        const newSubscribers = profileSubscribers.filter(
          (id) => id !== currentUserId
        );
        await updateDoc(profileRef, {
          subscribers: newSubscribers,
        });

        console.log("Deixou de seguir com sucesso");
      } else {
        // ✅ SEGUIR
        if (!currentSubscriptions.includes(profileId)) {
          const newSubscriptions = [...currentSubscriptions, profileId];
          await updateDoc(userRef, {
            subscriptions: newSubscriptions,
          });
        }

        if (!profileSubscribers.includes(currentUserId)) {
          const newSubscribers = [...profileSubscribers, currentUserId];
          await updateDoc(profileRef, {
            subscribers: newSubscribers,
          });
        }

        console.log("Seguiu com sucesso");
      }

      // ✅ Atualizar estado local
      onSubscribeClick?.(!isSubscribed);
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
      alert("Erro ao atualizar seguimento: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 30,
        padding: 20,
        background: "#f9f9f9",
        borderRadius: 8,
      }}
    >
      <div>
        {generateAvatar(
          profileData.name || profileData.email,
          profileData.photoURL,
          80
        )}
        <h2 style={{ margin: "10px 0 5px 0" }}>
          {profileData.name || profileData.email}
        </h2>
        <p style={{ color: "#666", margin: "5px 0" }}>
          {profileData.about || "Sem biografia"}
        </p>
        <small style={{ color: "#999" }}>
          Membro desde{" "}
          {profileData.createdAt
            ? new Date(
                profileData.createdAt.toDate?.() ||
                  profileData.createdAt?.seconds * 1000 ||
                  profileData.createdAt
              ).toLocaleDateString("pt-BR")
            : "data desconhecida"}
        </small>

        <div
          style={{
            marginTop: 15,
            display: "flex",
            gap: 20,
            fontSize: 14,
          }}
        >
          <div>
            <strong>Posts</strong>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>
              {postCount}
            </div>
          </div>
          <div>
            <strong>Seguidores</strong>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>
              {subscribersCount}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {isOwnProfile ? (
          <button
            onClick={onEditClick}
            style={{
              ...styles.button,
              padding: "10px 16px",
            }}
          >
            ✏️ Editar Perfil
          </button>
        ) : (
          <>
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              style={{
                ...styles.button,
                padding: "10px 16px",
                background: isSubscribed ? "#dc3545" : "#007bff",
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "..." : (isSubscribed ? "❌ Deixar de Seguir" : "✅ Seguir")}
            </button>

            <button
              onClick={onMessageClick}
              style={{
                ...styles.button,
                padding: "10px 16px",
              }}
            >
              💬 Mensagem
            </button>
          </>
        )}
      </div>
    </div>
  );
}