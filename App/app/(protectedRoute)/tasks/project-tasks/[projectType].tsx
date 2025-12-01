import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

interface Task {
  _id: string;
  title: string;
  status: string;
  priorityLevel: string;
  assignedTo: any[];
  userStory: string;
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

const priorityColors: { [key: string]: string } = {
  'Low': '#10B981',
  'Medium': '#F59E0B',
  'High': '#EF4444',
  'Weekly Priority': '#8B5CF6'
};

export default function ProjectTasks() {
  const { projectType, clientName, tasks: tasksParam } = useLocalSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (tasksParam) {
      try {
        const parsedTasks = JSON.parse(tasksParam as string);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error parsing tasks:', error);
      }
    }
  }, [tasksParam]);

  const handleTaskPress = (task: Task) => {
    router.push({
      pathname: '/tasks/task-detail/[taskId]',
      params: { 
        taskId: task._id,
        task: JSON.stringify(task)
      }
    });
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <TouchableOpacity
      onPress={() => handleTaskPress(task)}
      className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View 
          className="px-2 py-0.5 rounded-md"
          style={{ backgroundColor: statusColors[task.status] || '#6B7280' }}
        >
          <Text className="text-white text-xs font-medium">{task.status}</Text>
        </View>
        <Text 
          className="text-xs font-medium"
          style={{ color: priorityColors[task.priorityLevel] || '#6B7280' }}
        >
          {task.priorityLevel}
        </Text>
      </View>
      
      <Text className="text-lg font-semibold text-gray-900 mb-2">{task.title}</Text>
      
      {task.userStory && (
        <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
          {task.userStory}
        </Text>
      )}
      
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          {task.assignedTo?.filter(Boolean).length > 0 ? (
            <Text className="text-sm text-gray-600">
              Assigned to: {task.assignedTo.filter(Boolean).length === 1 
                ? (typeof task.assignedTo.filter(Boolean)[0] === 'object' 
                   ? task.assignedTo.filter(Boolean)[0]?.basicInfo?.firstName || 'User'
                   : 'User')
                : `${task.assignedTo.filter(Boolean).length} users`
              }
            </Text>
          ) : (
            <Text className="text-sm text-gray-400">No assignee</Text>
          )}
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="flex-row items-center mb-2"
        >
          <MaterialIcons name="arrow-back" size={24} color="#6B7280" />
          <Text className="ml-2 text-gray-600">Back to {clientName}</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">{projectType}</Text>
        <Text className="text-sm text-gray-500 mt-1">{tasks.length} tasks</Text>
      </View>



      {/* Tasks List */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <TaskCard task={item} />}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <MaterialIcons name="assignment" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg mt-4">No tasks found</Text>
          </View>
        }
      />
    </View>
  );
}