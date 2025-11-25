/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./authProvider.jsx";
import axiosInstance from "../api/axiosInstance";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  // 1️⃣ Establish socket connection
  useEffect(() => {
    if (!user?.id) return;

    const socket = io("http://192.168.1.34:3000", {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("join", user.id);
    });

    // 2️⃣ Receive live notifications
    socket.on("notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  // 3️⃣ Fetch saved notifications from backend when user logs in
  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifications = async () => {
      try {
        const filter = encodeURIComponent(
        `receiver=${user.id}`
      );
        const res = await axiosInstance.get(`/populate/read/notification?filter=${filter}`);
        const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
        ? res.data.data
        : [];
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
  }, [user?.id]);

  // 4️⃣ Compute unread count
  const unReadCount = notifications.filter((notif) => !notif.read).length;

  // 5️⃣ Mark as read
  const markAsRead = async (notificationId) => {
    try {
      const res = await axiosInstance.post(
        `/populate/update/notification/${notificationId}`,
        { read: true }
      );

      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // 6️⃣ Provide context
  return (
    <NotificationContext.Provider
      value={{ notifications, markAsRead, unReadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to access notifications anywhere
export const useNotification = () => useContext(NotificationContext);
