// components/ui/TopNavbar.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import io, { Socket } from "socket.io-client";

// Replace with your backend URL
const SOCKET_URL = "http://10.16.80.167:5000"; // Adjust to your backend

type Notification = {
  notificationId: string;
  message: string;
  read: boolean;
  meta?: { model: string; modelId: string | null };
  createdAt?: string;
};

type TopNavbarProps = {
  navigation: any;
  title?: string;
  userId: string;
};

export default function TopNavbar({
  navigation,
  title = "Logimax",
  userId,
}: TopNavbarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!userId) return;
    console.log("UserID in TopNavbar:", userId ?? "undefined");
    const newSocket = io(SOCKET_URL);
    console.log("Socket connected:", newSocket.connected);

    setSocket(newSocket);

    // Join user-specific room
    newSocket.emit("join", userId);

    // Listen for notifications
    newSocket.on("notification", (data: Notification) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  const handleToggleDropdown = () => setShowDropdown(!showDropdown);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, read: true } : n))
    );
  };

  return (
    <View>
      {/* Top Navbar */}
      <View className="w-full h-16 bg-blue-600 flex-row items-center px-4 justify-between">
        {/* Drawer toggle */}
        <TouchableOpacity
          onPress={() => navigation.toggleDrawer()}
          className="p-1"
        >
          <Ionicons name="menu" size={28} color="white" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-white text-lg font-bold">{title}</Text>

        {/* Notification Icon */}
        <TouchableOpacity
          onPress={handleToggleDropdown}
          className="relative p-1"
        >
          <Ionicons name="notifications" size={28} color="white" />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-600 rounded-full px-1">
              <Text className="text-white text-xs font-bold">
                {unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View className="w-7" />
      </View>

      {/* Dropdown */}
      <Modal
        isVisible={showDropdown}
        onBackdropPress={() => setShowDropdown(false)}
        backdropOpacity={0.1}
        style={{ margin: 0, justifyContent: "flex-start", marginTop: 60 }}
      >
        <View className="bg-white mx-2 rounded-lg max-h-80">
          {notifications.length === 0 ? (
            <Text className="text-center p-3 text-gray-500">
              No notifications
            </Text>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.notificationId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleMarkAsRead(item.notificationId)}
                  className={`p-3 border-b border-gray-200 ${
                    !item.read ? "bg-blue-50" : ""
                  }`}
                >
                  <Text className="text-gray-800">{item.message}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
