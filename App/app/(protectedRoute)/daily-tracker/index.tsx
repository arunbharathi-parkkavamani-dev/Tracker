import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, FlatList } from 'react-native';
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      
      // Fetch clients like tasks page
      const tasksResponse = await axiosInstance.get('/populate/read/tasks?filter={"status":{"$ne":"Deleted"}}&populateFields={"clientId":"name"}');
      const tasksData = tasksResponse.data.data || [];
      const uniqueClients = tasksData
        .map((task: any) => task.clientId)
        .filter((client: any) => client && client._id && client.name)
        .reduce((acc: Client[], client: Client) => {
          if (!acc.find(c => c._id === client._id)) {
            acc.push(client);
          }
          return acc;
        }, []);
      setClients(uniqueClients);
      
      // Fetch activities for selected date
      const activitiesResponse = await axiosInstance.get(
        `/populate/read/dailyactivities?filter={"employee":"${userId}","date":"${selectedDate}"}&populateFields={"clientId":"name"}`
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
      await axiosInstance.post('/populate/create/dailyactivities', {
        employee: userId,
        clientId: selectedClient._id,
        activity: activityText.trim(),
        date: selectedDate
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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      {/* Header with Date Selector */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Daily Activity Tracker</Text>
        
        {/* Date Navigation */}
        <View className="flex-row items-center justify-between mt-3">
          <TouchableOpacity
            onPress={() => {
              const prevDate = new Date(selectedDate);
              prevDate.setDate(prevDate.getDate() - 1);
              setSelectedDate(prevDate.toISOString().split('T')[0]);
            }}
            className="p-2"
          >
            <MaterialIcons name="chevron-left" size={24} color="#3B82F6" />
          </TouchableOpacity>
          
          <Text className="text-lg font-semibold text-gray-900">
            {formatDate(selectedDate)} - {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', month: 'short', day: 'numeric' 
            })}
          </Text>
          
          <TouchableOpacity
            onPress={() => {
              const nextDate = new Date(selectedDate);
              nextDate.setDate(nextDate.getDate() + 1);
              if (nextDate <= new Date()) {
                setSelectedDate(nextDate.toISOString().split('T')[0]);
              }
            }}
            className="p-2"
            disabled={selectedDate >= new Date().toISOString().split('T')[0]}
          >
            <MaterialIcons 
              name="chevron-right" 
              size={24} 
              color={selectedDate >= new Date().toISOString().split('T')[0] ? "#D1D5DB" : "#3B82F6"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 py-4">
        {/* Add Activity Form */}
        <View className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Add New Activity</Text>
          
          {/* Client Selection with Autocomplete */}
          <Text className="text-sm font-medium text-gray-700 mb-2">Select Client</Text>
          <TouchableOpacity
            onPress={() => setShowClientDropdown(true)}
            className="border border-gray-300 rounded-lg p-3 mb-4 flex-row items-center justify-between"
          >
            <Text className={selectedClient ? 'text-gray-900' : 'text-gray-500'}>
              {selectedClient ? selectedClient.name : 'Choose a client...'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
          </TouchableOpacity>

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

        {/* Activities for Selected Date */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Activities for {formatDate(selectedDate)}
          </Text>
          
          {activities.length === 0 ? (
            <View className="items-center py-8">
              <MaterialIcons name="assignment" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No activities for {formatDate(selectedDate)}</Text>
            </View>
          ) : (
            activities.map((activity, index) => (
              <View key={activity._id} className="mb-4 last:mb-0">
                <View className="flex-row items-start">
                  <View className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="font-semibold text-gray-900">
                        {activity.clientId?.name || 'Unknown Client'}
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

      {/* Client Selection Modal */}
      <Modal
        visible={showClientDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClientDropdown(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-96">
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold">Select Client</Text>
                <TouchableOpacity onPress={() => setShowClientDropdown(false)}>
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                className="border border-gray-300 rounded-lg p-3"
                placeholder="Search clients..."
                value={clientSearch}
                onChangeText={setClientSearch}
              />
            </View>
            
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedClient(item);
                    setClientSearch('');
                    setShowClientDropdown(false);
                  }}
                  className="p-4 border-b border-gray-100"
                >
                  <Text className="text-gray-900 font-medium">{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="p-8 items-center">
                  <Text className="text-gray-500">No clients found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}