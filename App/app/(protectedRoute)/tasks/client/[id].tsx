import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import axiosInstance from '@/api/axiosInstance';
import { MaterialIcons } from '@expo/vector-icons';

interface ProjectType {
  id: string;
  title: string;
  color: string;
  taskCount: number;
}

interface Task {
  _id: string;
  title: string;
  status: string;
  projectTypeId: { name: string };
  priorityLevel: string;
  assignedTo: any[];
}

export default function ClientTasks() {
  const { id, name } = useLocalSearchParams();
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      // Fetch client's project types
      const clientResponse = await axiosInstance.get(
        `/populate/read/clients/${id}?fields=projectTypeId&populateFields={"projectTypeId":"name"}`
      );

      // Fetch client's tasks with proper population
      const tasksResponse = await axiosInstance.get(
        `/populate/read/tasks?filter={"clientId":"${id}","status":{"$ne":"Deleted"}}&populateFields={"projectTypeId":"name","assignedTo":"basicInfo"}`
      );

      const clientData = clientResponse.data.data;
      const tasksData = tasksResponse.data.data || [];

      setTasks(tasksData);

      // Create project type columns with task counts
      const colors = ['#8B5CF6', '#10B981', '#EF4444', '#6366F1', '#F59E0B', '#EC4899'];
      const projectTypeColumns = (clientData.projectTypes || []).map((projectType: any, index: number) => {
        const taskCount = tasksData.filter((task: Task) => task.projectTypeId?.name === projectType.name).length;
        return {
          id: projectType.name,
          title: projectType.name,
          color: colors[index % colors.length],
          taskCount
        };
      });

      setProjectTypes(projectTypeColumns);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectTypePress = (projectType: ProjectType) => {
    const projectTasks = tasks.filter(task => task.projectType?.name === projectType.id);
    router.push({
      pathname: '/tasks/project-tasks/[projectType]',
      params: {
        projectType: projectType.id,
        clientId: id,
        clientName: name,
        tasks: JSON.stringify(projectTasks)
      }
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading project types...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-2"
        >
          <MaterialIcons name="arrow-back" size={24} color="#6B7280" />
          <Text className="ml-2 text-gray-600">Back to Clients</Text>
        </TouchableOpacity>

        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">{name}</Text>
            <Text className="text-sm text-gray-500 mt-1">Select project type to view tasks</Text>
          </View>

          {/* View Toggle */}
          <View className="flex-row bg-gray-100 rounded-lg p-1">
            <TouchableOpacity
              onPress={() => setViewMode('grid')}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
                shadowColor: viewMode === 'grid' ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: viewMode === 'grid' ? 0.1 : 0,
                shadowRadius: 2,
                elevation: viewMode === 'grid' ? 2 : 0
              }}
            >
              <MaterialIcons
                name="grid-view"
                size={20}
                color={viewMode === 'grid' ? '#3B82F6' : '#6B7280'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              style={{
                padding: 8,
                borderRadius: 6,
                marginLeft: 4,
                backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                shadowColor: viewMode === 'list' ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: viewMode === 'list' ? 0.1 : 0,
                shadowRadius: 2,
                elevation: viewMode === 'list' ? 2 : 0
              }}
            >
              <MaterialIcons
                name="view-list"
                size={20}
                color={viewMode === 'list' ? '#3B82F6' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Project Types */}
      {viewMode === 'grid' ? (
        <FlatList
          key="grid"
          data={projectTypes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 16 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleProjectTypePress(item)}
              className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200"
              style={{ width: '48%' }}
            >
              <View className="items-center">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: item.color }}
                >
                  <MaterialIcons name="folder" size={24} color="white" />
                </View>
                <Text className="text-lg font-semibold text-gray-900 text-center mb-1">
                  {item.title}
                </Text>
                <Text className="text-sm text-gray-500">
                  {item.taskCount} task{item.taskCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <MaterialIcons name="folder-open" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 text-lg mt-4">No project types found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="list"
          data={projectTypes}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleProjectTypePress(item)}
              className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200 flex-row items-center"
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: item.color }}
              >
                <MaterialIcons name="folder" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 mb-1">
                  {item.title}
                </Text>
                <Text className="text-sm text-gray-500">
                  {item.taskCount} task{item.taskCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#D1D5DB" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <MaterialIcons name="folder-open" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 text-lg mt-4">No project types found</Text>
            </View>
          }
        />
      )}

    </View>
  );
}