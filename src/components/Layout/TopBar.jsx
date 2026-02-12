/**
 * TopBar.jsx - Top bar with navigation
 */


export default function TopBar({
  displayName,
  unreadCount,
  onProfileClick,
  onNotificationsClick,
  onChatClick,
  onLogout,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        marginBottom: 15,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={onProfileClick}
          style={{
            background: "#007bff",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          👤 Profile
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={onNotificationsClick}
            style={{
              background: "#007bff",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            🔔 Notifications
          </button>
          {unreadCount > 0 && (
            <div
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                background: "red",
                color: "#fff",
                width: 20,
                height: 20,
                borderRadius: "50%",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {unreadCount}
            </div>
          )}
        </div>

        <button
          onClick={onChatClick}
          style={{
            background: "#007bff",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          💬 Chat
        </button>
      </div>

      <div>
        <h3>Hello, {displayName}</h3>
        <button
          onClick={onLogout}
          style={{
            background: "#dc3545",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
