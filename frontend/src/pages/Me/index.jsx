/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import {useAuth} from "../../context/authProvider.jsx"

export default function TestSocket() {
  const [notifications, setNotifications] = useState([]);
  const {user } = useAuth();

  useEffect(() => {
    // 1️⃣ Connect to backend Socket.IO
    const socket = io("http://10.108.186.208:3000", {
      withCredentials: true,
      transports: ["websocket"], // ensures stable connection
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO:", socket.id);
      socket.emit("join", user.id);
    });

    // 2️⃣ Listen for live notifications
    socket.on("notification", (data) => {
      console.log("📩 Received live notification:", data);
      setNotifications((prev) => [data, ...prev]); // prepend new notification
    });

    // 3️⃣ Fetch existing notifications from your backend
    const fetchNotifications = async () => {
      try {
        const res = await axios.post(
          "http://10.108.186.208:3000/api/notifications/pending",
          { managerId: user.id },
          { withCredentials: true }
        );
        if (res.data && Array.isArray(res.data)) {
          setNotifications(res.data);
        } else if (res.data.data) {
          console.log("Fetched existing notifications:", res.data);
          setNotifications(res.data.data);
          console.log("Fetching existing notifications for user:", res.data.data);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    fetchNotifications();

    // Cleanup when component unmounts
    return () => {
      socket.disconnect();
    };
  }, [user.id]);

  // 4️⃣ Render notifications
  return (
    <div style={{ padding: "20px" }}>
      <h2>🔔 Notifications</h2>

      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {notifications.map((note, index) => (
            <li
              key={note.notificationId || index}
              style={{
                background: "#f5f5f5",
                marginBottom: "8px",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              <strong>{note.message}</strong>
              {note.createdAt && (
                <div style={{ fontSize: "12px", color: "#777" }}>
                  {new Date(note.createdAt).toLocaleString()}
                </div>
              )}
              {note.path && (
                <div style={{ fontSize: "12px", color: "#007bff" }}>
                  {note.path}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
