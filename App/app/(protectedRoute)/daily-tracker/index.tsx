import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Client {
  _id: string;
  name: string;
}

interface Activity {
  _id: string;
  clientId: Client;
  activity: string;
  date: string;
  createdAt: string;
}

export default function DailyTracker() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activityText, setActivityText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      
      // Fetch clients
      const clientsResponse = await axiosInstance.get('/populate/read/clients?fields=name');
      setClients(clientsResponse.data.data || []);
      
      // Fetch today's activities
      const today = new Date().toISOString().split('T')[0];
      const activitiesResponse = await axiosInstance.get(
        `/populate/read/dailyactivities?filter={"employee":"${userId}","date":"${today}"}&populateFields={"clientId":"name"}`
      );
      setActivities(activitiesResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitActivity = async () => {
    if (!selectedClient || !activityText.trim()) {
      Alert.alert('Error', 'Please select a client and enter activity details');
      return;
    }

    try {
      setSubmitting(true);
      const userId = await AsyncStorage.getItem('userId');
      const today = new Date().toISOString().split('T')[0];

      await axiosInstance.post('/populate/create/dailyactivities', {
        employee: userId,
        clientId: selectedClient._id,
        activity: activityText.trim(),
        date: today
      });

      setActivityText('');
      setSelectedClient(null);
      Alert.alert('Success', 'Activity added successfully');
      fetchData(); // Refresh activities
    } catch (error) {
      console.error('Error submitting activity:', error);
      Alert.alert('Error', 'Failed to add activity');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading daily tracker...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Daily Activity Tracker</Text>
        <Text className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <View className="px-4 py-4">
        {/* Add Activity Form */}
        <View className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Add New Activity</Text>
          
          {/* Client Selection */}
          <Text className="text-sm font-medium text-gray-700 mb-2">Select Client</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {clients.map((client) => (
              <TouchableOpacity
                key={client._id}
                onPress={() => setSelectedClient(client)}
                className={`px-4 py-2 rounded-full mr-2 border ${
                  selectedClient?._id === client._id 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  selectedClient?._id === client._id ? 'text-white' : 'text-gray-700'
                }`}>
                  {client.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Activity Input */}
          <Text className="text-sm font-medium text-gray-700 mb-2">Activity Details</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-900"
            placeholder="Describe your activity..."
            value={activityText}
            onChangeText={setActivityText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitActivity}
            disabled={submitting || !selectedClient || !activityText.trim()}
            className={`rounded-lg p-3 flex-row items-center justify-center ${
              submitting || !selectedClient || !activityText.trim()
                ? 'bg-gray-300' 
                : 'bg-blue-500'
            }`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialIcons name="add" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Add Activity</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Today's Activities */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Today's Activities</Text>
          
          {activities.length === 0 ? (
            <View className="items-center py-8">
              <MaterialIcons name="assignment" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No activities added today</Text>
            </View>
          ) : (
            activities.map((activity, index) => (
              <View key={activity._id} className="mb-4 last:mb-0">
                <View className="flex-row items-start">
                  <View className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="font-semibold text-gray-900">
                        {activity.clientId.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {formatTime(activity.createdAt)}
                      </Text>
                    </View>
                    <Text className="text-gray-700 text-sm leading-5">
                      {activity.activity}
                    </Text>
                  </View>
                </View>
                {index < activities.length - 1 && (
                  <View className="ml-5 mt-4 border-b border-gray-100" />
                )}
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}