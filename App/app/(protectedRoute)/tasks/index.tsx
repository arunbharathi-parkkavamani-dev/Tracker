import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { router } from 'expo-router';
import axiosInstance from '@/api/axiosInstance';
import { MaterialIcons } from '@expo/vector-icons';

interface Client {
  _id: string;
  name: string;
}

export default function Tasks() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/populate/read/tasks?filter={"status":{"$ne":"Deleted"}}&populateFields={"clientId":"name"}');
      
      const tasksData = response.data.data || [];
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
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClientPress = (client: Client) => {
    router.push(`/tasks/client/${client._id}?name=${encodeURIComponent(client.name)}`);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading clients...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-3">Select Client</Text>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <MaterialIcons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search clients..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Client List */}
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleClientPress(item)}
            className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
                <Text className="text-sm text-gray-500 mt-1">Tap to view tasks</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <MaterialIcons name="business" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg mt-4">No clients found</Text>
          </View>
        }
      />
    </View>
  );
}