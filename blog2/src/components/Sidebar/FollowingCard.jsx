/**
 * FollowingCard.jsx - Card individual de usuário seguido
 */

import { generateAvatar } from "../../utils/helpers";

export default function FollowingCard({
  user,
  onProfileClick,
  onMessageClick,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 15,
        padding: 10,
        background: "#f9f9f9",
        borderRadius: 6,
      }}
    >
      <div
        onClick={onProfileClick}
        style={{
          cursor: "pointer",
          flex: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        {generateAvatar(
          user.name || user.email,
          user.photoURL,
          40
        )}
        <div>
          <strong>{user.name || user.email}</strong>
          <div style={{ fontSize: 12, color: "#666" }}>
            {user.subscribers?.length || 0} seguidores
          </div>
        </div>
      </div>

      <button
        onClick={onMessageClick}
        style={{
          background: "#007bff",
          color: "#fff",
          border: "none",
          padding: "6px 10px",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        💬
      </button>
    </div>
  );
}