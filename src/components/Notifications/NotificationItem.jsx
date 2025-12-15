/**
 * NotificationItem.jsx - Item individual de notificação
 */

import { formatDate } from "../../utils/helpers";

export default function NotificationItem({
  notification,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 10,
        borderBottom: "1px solid #eee",
        background: notification.isRead
          ? "#fff"
          : "#f0f8ff",
        cursor: "pointer",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          notification.isRead ? "#f9f9f9" : "#e8f4ff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          notification.isRead ? "#fff" : "#f0f8ff";
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500 }}>
        {notification.text}
      </div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
        {notification.type} •{" "}
        {formatDate(notification.timestamp)}
      </div>
      {!notification.isRead && (
        <div
          style={{
            display: "inline-block",
            background: "red",
            color: "#fff",
            borderRadius: "50%",
            width: 8,
            height: 8,
            marginTop: 6,
          }}
        />
      )}
    </div>
  );
}