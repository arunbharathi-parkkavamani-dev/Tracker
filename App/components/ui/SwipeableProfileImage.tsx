import React, { useState } from 'react';
import { View, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SwipeableProfileImageProps {
  imageUri?: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export default function SwipeableProfileImage({ 
  imageUri, 
  firstName, 
  lastName, 
  role 
}: SwipeableProfileImageProps) {
  const [isCompact, setIsCompact] = useState(false);

  const containerStyle = useAnimatedStyle(() => ({
    height: withSpring(isCompact ? 80 : screenHeight * 0.4),
  }));

  const toggleView = () => {
    setIsCompact(!isCompact);
  };

  if (isCompact) {
    return (
      <TouchableOpacity onPress={toggleView} activeOpacity={0.9}>
        <Animated.View style={[containerStyle]} className="flex-row items-center px-4 py-4 bg-white">
          <View className="w-12 h-12 rounded-full overflow-hidden mr-3">
            {imageUri ? (
              <Image 
                source={{ uri: imageUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-blue-600 items-center justify-center">
                <Text className="text-white font-bold text-lg">
                  {firstName?.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-gray-900 text-lg font-semibold">{firstName}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={toggleView} activeOpacity={0.9}>
      <Animated.View style={[containerStyle]} className="relative overflow-hidden">
        {imageUri ? (
          <Image 
            source={{ uri: imageUri }}
            className="w-full h-full"
            resizeMode="contain"
          />
        ) : (
          <View className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 items-center justify-center">
            <Text className="text-6xl font-bold text-white">
              {firstName?.charAt(0)}{lastName?.charAt(0)}
            </Text>
          </View>
        )}
        
        <View className="absolute inset-0 bg-black/30" />
        
        <View className="absolute bottom-4 left-4 right-4">
          <Text className="text-white text-2xl font-bold shadow-lg">
            {firstName} {lastName}
          </Text>
          <Text className="text-white/90 text-sm mt-1 shadow-lg">
            {role || 'Employee'}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}