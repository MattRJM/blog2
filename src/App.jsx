import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { usePosts } from "./hooks/usePosts";
import { useNotifications } from "./hooks/useNotifications";
import { useChat } from "./hooks/useChat";
import { UserProvider } from "./contexts/UserContext";
import MessageThread from "./components/Chat/MessageThread";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import PostCard from "./components/Post/PostCard";
import PostForm from "./components/Post/PostForm";
import NotificationItem from "./components/Notifications/NotificationItem";
import FollowingList from "./components/Sidebar/FollowingList"; 
import TopBar from "./components/Layout/TopBar";
import ProfileHeader from "./components/Profile/ProfileHeader";
import ProfileEditModal from "./components/Profile/ProfileEditModal";

import { styles, globalStyles } from "./utils/helpers";
import { markNotificationsAsRead } from "./services/notificationsService";

function AppContent() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedOtherUserId, setSelectedOtherUserId] = useState(null);

  const { user, currentUserData, logout, displayName } = useAuth();
  const { posts: feedPosts } = usePosts(null, 50);
  const { posts: userPosts } = usePosts(user?.uid);
  const { notifications, unreadCount } = useNotifications();
  const { conversations } = useChat();

  const [showUserPosts, setShowUserPosts] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);

  // ✅ LISTENER em tempo real para sincronizar profileUser
  useEffect(() => {
    if (!profileUser?.uid) return;

    const userRef = doc(db, "users", profileUser.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfileUser((prev) => ({
          ...prev,
          ...snapshot.data(),
        }));
      }
    });

    return () => unsubscribe();
  }, [profileUser?.uid]);

  if (!user) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "auto",
          padding: 40,
          textAlign: "center",
        }}
      >
        <h1>Blog Social</h1>
        <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
          <div style={{ flex: 1 }}>
            <LoginForm />
          </div>
          <div style={{ flex: 1 }}>
            <RegisterForm />
          </div>
        </div>
      </div>
    );
  }

  const postsToShow = profileUser
    ? feedPosts.filter((p) => p.authorId === profileUser.uid)
    : showUserPosts
    ? userPosts
    : feedPosts;

  return (
    <div style={{ ...styles.container }}>
      <style>{globalStyles}</style>

      <div style={styles.mainContent}>
        <TopBar
          displayName={displayName}
          unreadCount={unreadCount}
          onProfileClick={() => setProfileUser(currentUserData)}
          onNotificationsClick={() => {
            setShowNotificationsModal(true);
            markNotificationsAsRead(user.uid);
          }}
          onChatClick={() => setShowChatModal(!showChatModal)}
          onLogout={logout}
        />

        <hr />

        {profileUser ? (
          <>
            <button
              onClick={() => setProfileUser(null)}
              style={{ marginBottom: 20, ...styles.button }}
            >
              ⬅️ Voltar
            </button>

            <ProfileHeader
              profile={profileUser}
              currentUserId={user?.uid}
              isOwnProfile={profileUser?.uid === user?.uid}
              onEditClick={() => {
                if (profileUser?.uid === user?.uid) {
                  setShowProfileEditModal(true);
                } else {
                  alert("Você só pode editar seu próprio perfil");
                }
              }}
              onSubscribeClick={(newSubscriptionState) => {
                setProfileUser({
                  ...profileUser,
                  isSubscribed: newSubscriptionState,
                });
              }}
              onMessageClick={(userId, userData) => {
                // Buscar conversa com este usuário
                const conversation = conversations?.find((conv) => {
                  const members = conv.members || [];
                  return members.includes(userId) && members.includes(user?.uid);
                });

                if (conversation) {
                  setSelectedConversation(conversation.id);
                  setSelectedOtherUserId(userId);
                } else {
                  setSelectedOtherUserId(userId);
                  setSelectedConversation(null);
                }
                
                setShowChatModal(false);
              }}
              posts={feedPosts}
            />

            {postsToShow.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
                📝 Nenhum post ainda
              </div>
            ) : (
              postsToShow.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user.uid}
                  onAuthorClick={(authorData) => {
                    const isSubscribed = authorData?.subscribers?.includes(user?.uid);
                    setProfileUser({
                      ...authorData,
                      isSubscribed,
                    });
                  }}
                  onPostDeleted={() => {
                    // Refresh automático
                  }}
                />
              ))
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setShowUserPosts(false)}
              style={{ marginRight: 10, ...styles.button }}
            >
              🏠 Feed
            </button>
            <button
              onClick={() => setShowUserPosts(true)}
              style={styles.button}
            >
              📝 Meu Blog
            </button>

            <hr />

            {showUserPosts && (
              <PostForm
                userId={user.uid}
                userEmail={user.email}
                onPostCreated={() => {
                  // Refresh automático via listener
                }}
              />
            )}

            {postsToShow.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user.uid}
                onAuthorClick={(authorData) => {
                  const isSubscribed = authorData?.subscribers?.includes(user?.uid);
                  setProfileUser({
                    ...authorData,
                    isSubscribed,
                  });
                }}
                onPostDeleted={() => {
                  // Refresh automático
                }}
              />
            ))}
          </>
        )}

        {/* Notificações Modal */}
        {showNotificationsModal && (
          <div
            style={{
              position: "fixed",
              right: 20,
              top: 70,
              width: 360,
              maxHeight: "70vh",
              overflowY: "auto",
              background: "#fff",
              border: "1px solid #ddd",
              zIndex: 80,
              padding: 10,
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <strong>Notificações</strong>
              <button
                onClick={() => setShowNotificationsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>

            {notifications.length === 0 && (
              <p style={{ color: "#666" }}>Nenhuma notificação.</p>
            )}

            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={() => {
                  setShowNotificationsModal(false);
                }}
              />
            ))}
          </div>
        )}

        {/* Chat Modal - Lista de Conversas */}
        {showChatModal && !selectedConversation && !selectedOtherUserId && (
          <div
            style={{
              position: "fixed",
              right: 20,
              bottom: 20,
              width: 360,
              height: 500,
              background: "#fff",
              border: "1px solid #ddd",
              zIndex: 90,
              display: "flex",
              flexDirection: "column",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: "bold",
                background: "#f9f9f9",
              }}
            >
              <span>💬 Conversas</span>
              <button
                onClick={() => setShowChatModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  padding: 0,
                  width: 24,
                  height: 24,
                }}
              >
                ✕
              </button>
            </div>

            {/* Lista de conversas */}
            <div
              style={{
                flex: 1,
                padding: 12,
                overflowY: "auto",
                background: "#fafafa",
              }}
            >
              {conversations.length === 0 ? (
                <div style={{ color: "#999", fontSize: 12, textAlign: "center", margin: "auto" }}>
                  Nenhuma conversa ainda
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherUserId = conv.members.find((m) => m !== user?.uid);
                  
                  // ✅ Buscar dados do outro usuário da conversa
                  const otherUser = feedPosts
                    .filter(p => p.authorId === otherUserId)
                    .map(p => ({
                      name: p.authorName,
                      photoURL: p.authorPhoto,
                      email: p.authorEmail
                    }))[0] || {
                    name: otherUserId,
                    photoURL: "",
                    email: otherUserId
                  };

                  // ✅ Avatar helper
                  const generateAvatar = (name, photoURL, size = 40) => {
                    if (photoURL) {
                      return (
                        <img
                          src={photoURL}
                          alt="avatar"
                          style={{
                            width: size,
                            height: size,
                            borderRadius: "50%",
                            objectFit: "cover",
                            marginRight: 10,
                          }}
                        />
                      );
                    }
                    const initials = (name || "")
                      .split(" ")
                      .map(n => n[0] || "")
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    const first = (name || "A").charCodeAt(0) || 65;
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
                          fontSize: size * 0.35,
                        }}
                      >
                        {initials}
                      </div>
                    );
                  };

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv.id);
                        setSelectedOtherUserId(otherUserId);
                        setShowChatModal(false);
                      }}
                      style={{
                        padding: 12,
                        borderBottom: "1px solid #eee",
                        cursor: "pointer",
                        background: "#fff",
                        transition: "background 0.2s",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => (e.target.style.background = "#f0f0f0")}
                      onMouseLeave={(e) => (e.target.style.background = "#fff")}
                    >
                      {/* ✅ Avatar */}
                      {generateAvatar(otherUser.name, otherUser.photoURL, 40)}

                      {/* ✅ Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "500", fontSize: 13 }}>
                          {otherUser.name || otherUser.email}
                        </div>
                        <div style={{ color: "#999", fontSize: 11, marginTop: 4 }}>
                          {conv.lastMessage || "Sem mensagens"}
                        </div>
                        <div style={{ color: "#ccc", fontSize: 10, marginTop: 2 }}>
                          {conv.lastMessageTime?.toDate?.()?.toLocaleDateString?.() || ""}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* MessageThread - Conversa Aberta */}
        {(selectedConversation || selectedOtherUserId) && (
          <MessageThread
            conversationId={selectedConversation}
            otherUserId={selectedOtherUserId}
            otherUserName={selectedOtherUserId}
            currentUserId={user?.uid}
            onClose={() => {
              setSelectedConversation(null);
              setSelectedOtherUserId(null);
              setShowChatModal(false);
            }}
          />
        )}

        {/* Profile Edit Modal */}
        {showProfileEditModal && (
          <ProfileEditModal
            profile={currentUserData}
            onClose={() => setShowProfileEditModal(false)}
            onSave={(updatedData) => {
              setShowProfileEditModal(false);
            }}
          />
        )}
      </div>

      {/* Sidebar com Seguindo */}
      <FollowingList
        followingList={currentUserData?.subscriptions || []}
        onProfileClick={(userData) => {
          setProfileUser(userData);
        }}
        onMessageClick={(userId, userData) => {
          // ✅ NOVO: Buscar a conversa com este usuário
          const conversation = conversations?.find((conv) => {
            const members = conv.members || [];
            return members.includes(userId) && members.includes(user?.uid);
          });

          if (conversation) {
            // ✅ Conversa existe - abrir direto
            setSelectedConversation(conversation.id);
          } else {
            // ✅ Conversa não existe - passar null para criar
            setSelectedConversation(null);
          }
          
          setSelectedOtherUserId(userId);
          setShowChatModal(false); // ✅ Fechar lista de chats
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}