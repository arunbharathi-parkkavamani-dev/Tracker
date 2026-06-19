import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  RefreshControl,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import {
  Search,
  Plus,
  Calendar,
  CheckSquare,
  AlertCircle,
  Clock,
  ChevronRight,
  User as UserIcon,
  X,
  SlidersHorizontal
} from 'lucide-react-native';
import { AuthContext } from '@/context/AuthContext';
import { useOptimizedDataFetching } from '@/hooks/useOptimizedDataFetching';

interface Client {
  _id: string;
  name: string;
}

interface ProjectType {
  _id: string;
  name: string;
}

interface Task {
  _id: string;
  title: string;
  status: string;
  priorityLevel: string;
  userStory?: string;
  description?: string;
  clientId?: Client;
  projectTypeId?: ProjectType;
  assignedTo?: any[];
  createdBy?: any;
  dueDate?: string;
  createdAt: string;
}

const STATUS_TABS = ['All', 'To Do', 'In Progress', 'In Review', 'Completed', 'Backlogs'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Backlogs': { bg: '#F1F5F9', text: '#475569' },
  'To Do': { bg: '#FEF3C7', text: '#D97706' },
  'In Progress': { bg: '#DBEAFE', text: '#1E40AF' },
  'In Review': { bg: '#F3E8FF', text: '#6B21A8' },
  'Approved': { bg: '#D1FAE5', text: '#065F46' },
  'Rejected': { bg: '#FEE2E2', text: '#B91C1C' },
  'Completed': { bg: '#D1FAE5', text: '#065F46' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  'Low': { bg: '#ECFDF5', text: '#059669' },
  'Medium': { bg: '#FFFBEB', text: '#D97706' },
  'High': { bg: '#FEF2F2', text: '#DC2626' },
  'Weekly Priority': { bg: '#F5F3FF', text: '#7C3AED' }
};

export default function TasksIndex() {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const {
    data: fetchedTasks,
    loading,
    handleRefresh
  } = useOptimizedDataFetching('tasks', {
    initialLimit: 500, // Fetch large limit to filter on client-side
    initialFilters: { status: { $ne: 'Deleted' } },
    initialSort: { createdAt: -1 },
    enableCache: true,
    backgroundRefresh: true,
    populateFields: {
      clientId: "name",
      projectTypeId: "name",
      assignedTo: "basicInfo"
    }
  });

  // Client-side filter to show "My Tasks" (Assigned to me OR created by me)
  const filteredTasks = useMemo(() => {
    if (!user?.id) return [];
    
    return (fetchedTasks || []).filter((task: any) => {
      // 1. My Tasks context check
      const isCreator = (task.createdBy?._id || task.createdBy) === user.id;
      const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some((assignee: any) => {
        const id = assignee?._id || assignee;
        return id === user.id;
      });
      const belongsToUser = isCreator || isAssigned;
      
      if (!belongsToUser) return false;

      // 2. Status filter
      if (selectedStatus !== 'All' && task.status !== selectedStatus) {
        return false;
      }

      // 3. Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesStory = task.userStory?.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query);
        const matchesClient = task.clientId?.name?.toLowerCase().includes(query);
        const matchesProject = task.projectTypeId?.name?.toLowerCase().includes(query);
        return matchesTitle || matchesStory || matchesClient || matchesProject;
      }

      return true;
    });
  }, [fetchedTasks, user?.id, selectedStatus, searchTerm]);

  const handleTaskPress = (task: Task) => {
    router.push({
      pathname: '/tasks/task-detail/[taskId]',
      params: { 
        taskId: task._id,
        task: JSON.stringify(task)
      }
    });
  };

  const renderTaskCard = ({ item }: { item: Task }) => {
    const statusStyle = STATUS_COLORS[item.status] || { bg: '#F3F4F6', text: '#4B5563' };
    const priorityStyle = PRIORITY_COLORS[item.priorityLevel] || { bg: '#F3F4F6', text: '#4B5563' };
    const dateStr = item.dueDate 
      ? new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    const clientName = item.clientId?.name || 'Internal';
    const projectName = item.projectTypeId?.name || 'General';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleTaskPress(item)}
        className="bg-white rounded-2xl mb-3 shadow-sm border border-gray-100 flex-row overflow-hidden"
      >
        {/* Left vertical color accent bar based on priority */}
        <View style={{ width: 4.5, backgroundColor: priorityStyle.text }} />

        <View className="flex-1 p-4">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-gray-400 text-[11px] font-semibold tracking-wider uppercase flex-1 mr-2" numberOfLines={1}>
              {clientName} · {projectName}
            </Text>
            
            <View style={{ backgroundColor: priorityStyle.bg }} className="px-2 py-0.5 rounded-full">
              <Text style={{ color: priorityStyle.text }} className="text-[10px] font-bold">
                {item.priorityLevel}
              </Text>
            </View>
          </View>

          <Text className="text-sm font-semibold text-[#1A1D2E] mb-2" numberOfLines={2}>
            {item.title}
          </Text>

          {item.userStory ? (
            <Text className="text-xs text-[#8890A8] mb-3" numberOfLines={2}>
              {item.userStory}
            </Text>
          ) : null}

          <View className="flex-row justify-between items-center pt-2 border-t border-gray-50">
            <View className="flex-row items-center gap-1">
              <Clock size={12} color="#8890A8" />
              <Text className="text-[11px] text-[#8890A8]">{item.dueDate ? 'Due' : 'Created'}: {dateStr}</Text>
            </View>

            <View className="flex-row items-center gap-2">
              <View style={{ backgroundColor: statusStyle.bg }} className="px-2.5 py-0.5 rounded-full">
                <Text style={{ color: statusStyle.text }} className="text-[10px] font-bold">
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#F7F8FC]">
      {/* Search and Filters Bar */}
      <View className="px-4 pt-3 pb-2 gap-2 bg-white border-b border-gray-100 shadow-sm">
        <View className="flex-row items-center bg-[#F7F8FC] border border-gray-100 rounded-xl px-3 py-2">
          <View className="mr-2">
            <Search size={18} color="#8890A8" />
          </View>
          <TextInput
            placeholder="Search by task title, client, user story..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#8890A8"
            className="flex-1 text-[#1A1D2E] text-sm p-0"
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <X size={18} color="#8890A8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Scrollable Filters */}
        <View className="flex-row">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
            {STATUS_TABS.map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setSelectedStatus(status)}
                className={`rounded-lg px-3 py-1.5 mr-2 border shadow-sm ${
                  selectedStatus === status
                    ? 'bg-[#6C3DE8] border-[#6C3DE8]'
                    : 'bg-white border-gray-150'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedStatus === status ? 'text-white' : 'text-[#8890A8]'
                  }`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Task List */}
      {loading && filteredTasks.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6C3DE8" />
          <Text className="mt-2 text-gray-500 text-sm">Loading tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, paddingTop: 12 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#6C3DE8" />
          }
          ListEmptyComponent={
            <View className="py-16 items-center justify-center">
              <View className="bg-violet-50 p-4 rounded-full mb-3">
                <CheckSquare size={32} color="#6C3DE8" />
              </View>
              <Text className="text-gray-800 font-bold text-base mb-1">No Tasks Found</Text>
              <Text className="text-gray-400 text-xs text-center max-w-[250px]">
                There are no tasks matching your active status filters or search query.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/tasks/add-task')}
        className="absolute bottom-6 right-6 bg-[#6C3DE8] w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}