import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '@/api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

interface Notification {
  _id: string;
  message: string;
  read: boolean;
  sender?: {
    basicInfo?: {
      firstName?: string;
      lastName?: string;
    };
  };
  createdAt: string;
  relatedModel?: string;
  relatedId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unReadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const decoded = jwtDecode(token);
      const userId = decoded.userId || decoded.id;
      
      const filter = JSON.stringify({ recipient: userId });
      const populateFields = JSON.stringify({ "sender": "basicInfo.firstName,basicInfo.lastName" });
      
      const res = await axiosInstance.get(
        `/populate/read/notifications?filter=${encodeURIComponent(filter)}&populateFields=${encodeURIComponent(populateFields)}`
      );
      
      const data = res.data?.data || [];
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unReadCount = notifications.filter((notif) => !notif.read).length;

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await axiosInstance.put(
        `/populate/update/notifications/${notificationId}`,
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
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, markAsRead, unReadCount, refreshNotifications: fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};