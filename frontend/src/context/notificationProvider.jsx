/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./authProvider.jsx";
import axiosInstance from "../api/axiosInstance";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  // 1️⃣ Establish socket connection
  useEffect(() => {
    if (!user?.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io(window.location.origin, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      // console.log("Socket connected");
      socketInstance.emit("join", user.id);
    });

    socketInstance.on("connect_error", (error) => {
      // console.log("Socket connection error:", error);
    });

    // 2️⃣ Receive live notifications
    socketInstance.on("notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [user?.id]);

  // 3️⃣ Fetch saved notifications from backend when user logs in
  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifications = async () => {
      try {
        const filter = { recipient: user.id };
        const res = await axiosInstance.post('/populate/read/notifications', {
          filter,
          populateFields: { "sender": "basicInfo.firstName,basicInfo.lastName,basicInfo.profileImage" }
        });
        const data = res.data?.data || [];
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
  }, [user?.id]);

  // 4️⃣ Compute unread count (handling both legacy read and new isRead backend schemas)
  const unReadCount = notifications.filter((notif) => !(notif.isRead || notif.read)).length;

  // 5️⃣ Mark as read
  const markAsRead = async (notificationId) => {
    try {
      const res = await axiosInstance.put(
        `/populate/update/notifications/${notificationId}`,
        { isRead: true }
      );

      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, isRead: true, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // 6️⃣ Delete / Dismiss a single notification
  const deleteNotification = async (notificationId) => {
    try {
      const res = await axiosInstance.put(
        `/populate/update/notifications/${notificationId}`,
        { isDeleted: true }
      );
      if (res.data.success) {
        setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // 7️⃣ Clear / Dismiss all notifications
  const clearAll = async () => {
    try {
      await Promise.all(
        notifications.map((notif) =>
          axiosInstance.put(`/populate/update/notifications/${notif._id}`, { isDeleted: true })
        )
      );
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // 8️⃣ Provide context
  return (
    <NotificationContext.Provider
      value={{ socket, notifications, markAsRead, unReadCount, deleteNotification, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to access notifications anywhere
export const useNotification = () => useContext(NotificationContext);
