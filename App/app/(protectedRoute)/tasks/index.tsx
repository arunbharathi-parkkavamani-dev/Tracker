import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import OptimizedList from '@/components/ui/OptimizedList';
import { useOptimizedDataFetching } from '@/hooks/useOptimizedDataFetching';

interface Client {
  _id: string;
  name: string;
}

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

  const {
    data: tasks,
    loading,
    handleRefresh
  } = useOptimizedDataFetching('tasks', {
    initialLimit: 50,
    initialFilters: { status: { $ne: 'Deleted' } },
    initialSort: { createdAt: -1 },
    enableCache: true,
    backgroundRefresh: true
  });

  useEffect(() => {
    // Extract unique clients from tasks
    const uniqueClients = tasks
      .map((task: any) => task.clientId)
      .filter((client: any) => client && client._id && client.name)
      .reduce((acc: Client[], client: Client) => {
        if (!acc.find(c => c._id === client._id)) {
          acc.push(client);
        }
        return acc;
      }, []);
    
    setClients(uniqueClients);
  }, [tasks]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClientPress = (client: Client) => {
    router.push(`/tasks/client/${client._id}?name=${encodeURIComponent(client.name)}`);
  };

  const renderClientItem = ({ item }: { item: Client }) => (
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
  );

  if (loading && clients.length === 0) {
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
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Select Client</Text>
          <TouchableOpacity
            onPress={() => router.push('/tasks/add-task')}
            className="bg-blue-600 rounded-full p-3"
          >
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mt-3">
          <MaterialIcons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search clients..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Optimized Client List */}
      <OptimizedList
        model="clients" // This will be overridden by our filtered data
        data={filteredClients}
        renderItem={renderClientItem}
        keyExtractor={(item) => item._id}
        refreshable={true}
        searchable={false} // We handle search above
        emptyMessage="No clients found"
        onRefresh={handleRefresh}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}