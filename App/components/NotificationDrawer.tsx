import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotification } from '@/context/NotificationContext';

interface NotificationDrawerProps {
  visible: boolean;
  onClose: () => void;
  slideAnim: Animated.Value;
}

const { width } = Dimensions.get('window');

export default function NotificationDrawer({ visible, onClose, slideAnim }: NotificationDrawerProps) {
  const { notifications, markAsRead } = useNotification();

  const handleNotificationPress = (notificationId: string) => {
    markAsRead(notificationId);
    // Add navigation logic here if needed
  };

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50">
      {/* Backdrop */}
      <TouchableOpacity 
        className="flex-1 bg-black/50"
        activeOpacity={1}
        onPress={onClose}
      />
      
      {/* Drawer */}
      <Animated.View 
        className="absolute right-0 top-0 bottom-0 bg-white w-80 shadow-lg"
        style={{
          transform: [{ translateX: slideAnim }]
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200 pt-16">
          <Text className="text-lg font-semibold text-gray-900">Notifications</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <ScrollView className="flex-1">
            {notifications.length === 0 ? (
              <View className="p-8 items-center">
                <MaterialIcons name="notifications-none" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">No notifications</Text>
              </View>
            ) : (
              notifications.map((notif) => (
                <TouchableOpacity
                  key={notif._id}
                  className={`p-4 border-b border-gray-100 ${
                    !notif.read ? 'bg-blue-50' : 'bg-white'
                  }`}
                  onPress={() => handleNotificationPress(notif._id)}
                >
                  <Text className={`text-sm ${!notif.read ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                    {notif.message}
                  </Text>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-xs text-gray-500">
                      {notif.sender?.basicInfo?.firstName} {notif.sender?.basicInfo?.lastName}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}