import React from "react";

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Props {
  notifications?: Notification[];
}

export default function NotificationFeed({ notifications = [] }: Props) {
  return (
    <div>
      <h2>Notifications</h2>
      {notifications.length === 0 && (
        <p style={{ color: "#94a3b8", fontSize: 14 }}>No notifications yet.</p>
      )}
      {notifications.map((n) => (
        <div key={n.id} style={{
          padding: "0.75rem",
          borderBottom: "1px solid #f1f5f9",
          background: n.read ? "#fff" : "#f0f4ff",
        }}>
          <div style={{ fontSize: 14 }}>{n.message}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{n.timestamp}</div>
        </div>
      ))}
    </div>
  );
}
