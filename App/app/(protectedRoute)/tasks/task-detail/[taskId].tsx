import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';

interface Task {
  _id: string;
  title: string;
  status: string;
  priorityLevel: string;
  userStory: string;
  observation: string;
  acceptanceCreteria: string;
  assignedTo: any[];
  createdBy: any;
  clientId: any;
  projectTypeId: any;
  createdAt: string;
}

const statusColors: { [key: string]: string } = {
  'Backlogs': '#6B7280',
  'To Do': '#F59E0B',
  'In Progress': '#3B82F6',
  'In Review': '#8B5CF6',
  'Approved': '#10B981',
  'Rejected': '#EF4444',
  'Completed': '#059669'
};

export default function TaskDetail() {
  const { taskId, task: taskParam } = useLocalSearchParams();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (taskParam) {
      try {
        const parsedTask = JSON.parse(taskParam as string);
        setTask(parsedTask);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing task:', error);
        fetchTaskDetails();
      }
    } else {
      fetchTaskDetails();
    }
  }, [taskId, taskParam]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const populateFields = {
        'clientId': 'name',
        'projectTypeId': 'name',
        'taskTypeId': 'name',
        'createdBy': 'basicInfo.firstName,basicInfo.lastName',
        'assignedTo': 'basicInfo.firstName,basicInfo.lastName'
      };
      
      const response = await axiosInstance.get(
        `/populate/read/tasks/${taskId}?populateFields=${encodeURIComponent(JSON.stringify(populateFields))}`
      );
      
      setTask(response.data.data);
    } catch (error) {
      console.error('Error fetching task details:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading task details...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <MaterialIcons name="error" size={64} color="#EF4444" />
        <Text className="text-gray-500 text-lg mt-4">Task not found</Text>
      </View>
    );
  }

  const InfoSection = ({ title, content }: { title: string; content: string }) => (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 mb-2">{title}</Text>
      <Text className="text-gray-700 leading-6">{content || 'Not specified'}</Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="flex-row items-center mb-3"
        >
          <MaterialIcons name="arrow-back" size={24} color="#6B7280" />
          <Text className="ml-2 text-gray-600">Back to Tasks</Text>
        </TouchableOpacity>
        
        <View className="flex-row justify-between items-start mb-3">
          <View 
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: statusColors[task.status] || '#6B7280' }}
          >
            <Text className="text-white text-sm font-medium">{task.status}</Text>
          </View>
          <Text className="text-sm text-gray-500">
            {task.priorityLevel} Priority
          </Text>
        </View>
        
        <Text className="text-2xl font-bold text-gray-900 mb-2">{task.title}</Text>
        
        {/* Assignees */}
        <View className="flex-row items-center">
          <Text className="text-sm text-gray-600 mr-2">Assigned to:</Text>
          <View className="flex-row">
            {task.assignedTo?.filter(Boolean).slice(0, 3).map((assignee, index) => (
              <View
                key={index}
                className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center border-2 border-white -ml-1"
                style={{ marginLeft: index > 0 ? -4 : 0 }}
              >
                <Text className="text-white text-xs">
                  {assignee?.basicInfo?.firstName?.charAt(0) || 'U'}
                </Text>
              </View>
            ))}
            {task.assignedTo?.filter(Boolean).length > 3 && (
              <View className="w-8 h-8 rounded-full bg-gray-400 items-center justify-center border-2 border-white -ml-1">
                <Text className="text-white text-xs">+{task.assignedTo.filter(Boolean).length - 3}</Text>
              </View>
            )}
            {(!task.assignedTo || task.assignedTo.filter(Boolean).length === 0) && (
              <Text className="text-sm text-gray-500">No one assigned</Text>
            )}
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="px-4 py-6">
        <InfoSection title="User Story" content={task.userStory} />
        <InfoSection title="Observation" content={task.observation} />
        <InfoSection title="Acceptance Criteria" content={task.acceptanceCreteria} />
        
        {/* Metadata */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Task Information</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Client</Text>
              <Text className="text-gray-900 font-medium">{task.clientId?.name || 'N/A'}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Project Type</Text>
              <Text className="text-gray-900 font-medium">{task.projectTypeId?.name || 'N/A'}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Created By</Text>
              <Text className="text-gray-900 font-medium">
                {task.createdBy?.basicInfo?.firstName} {task.createdBy?.basicInfo?.lastName}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Created Date</Text>
              <Text className="text-gray-900 font-medium">
                {new Date(task.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}