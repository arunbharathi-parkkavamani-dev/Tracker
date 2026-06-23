import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, FlatList } from 'react-native';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Clock,
  Briefcase,
  AlertCircle
} from 'lucide-react-native';
import axiosInstance from '@/api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import Toast from 'react-native-toast-message';

interface Client {
  _id: string;
  name: string;
  projectTypes?: ProjectType[];
}

interface ProjectType {
  _id: string;
  name: string;
}

interface TaskType {
  _id: string;
  name: string;
}

interface Activity {
  _id: string;
  client: Client;
  projectType?: ProjectType;
  taskType?: TaskType;
  activity: string;
  date: string;
  createdAt: string;
}

export default function DailyTracker() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null);
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);
  const [activityText, setActivityText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showProjectTypeDropdown, setShowProjectTypeDropdown] = useState(false);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [projectTypeSearch, setProjectTypeSearch] = useState('');
  const [taskTypeSearch, setTaskTypeSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchData(true); // Use refresh mode when date changes
    }
  }, [selectedDate]);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const decoded = jwtDecode<{ userId?: string; id?: string }>(token);
      const userId = decoded.userId || decoded.id;

      // Fetch clients with project types
      const clientsResponse = await axiosInstance.get('/populate/read/clients?populateFields={"projectTypes":"name"}');
      const clientsData = clientsResponse.data.data || [];
      // console.log('DailyTracker: Clients fetched:', clientsData.length);
      setClients(clientsData);

      // Fetch task types
      const taskTypesRes = await axiosInstance.get('/populate/read/tasktypes');
      setTaskTypes(taskTypesRes.data.data || []);

      // Fetch activities for selected date with user filter
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const dateFilter = {
        user: userId,
        date: {
          $gte: startOfDay.toISOString(),
          $lte: endOfDay.toISOString()
        }
      };

      const activitiesResponse = await axiosInstance.get(
        `/populate/read/dailyactivities?filter=${encodeURIComponent(JSON.stringify(dateFilter))}&populateFields={"client":"name","projectType":"name","taskType":"name"}&sort={"createdAt":-1}`
      );
      const activitiesData = activitiesResponse.data.data || [];

      // Since backend filter is not working, filter on frontend
      const filteredActivities = activitiesData.filter((activity: any) => {
        // Check user match
        const userMatch = activity.user?._id === userId;

        // Check date match - using activity.date (when activity was assigned to)
        const activityDate = new Date(activity.date).toISOString().split('T')[0];
        const dateMatch = activityDate === selectedDate;

        return userMatch && dateMatch;
      });

      setActivities(filteredActivities);
    } catch (error) {
      console.error('Error fetching data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load data'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmitActivity = async () => {
    if (!selectedClient || !selectedProjectType || !selectedTaskType || !activityText.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select client, project type, task type and enter activity details'
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const decoded = jwtDecode<{ userId?: string; id?: string }>(token);
      const userId = decoded.userId || decoded.id;

      await axiosInstance.post('/populate/create/dailyactivities', {
        user: userId,
        client: selectedClient._id,
        projectType: selectedProjectType._id,
        taskType: selectedTaskType._id,
        activity: activityText.trim(),
        date: new Date(selectedDate)
      });

      setActivityText('');
      setSelectedClient(null);
      setSelectedProjectType(null);
      setSelectedTaskType(null);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Activity added successfully'
      });
      fetchData(true); // Refresh activities without full loading
    } catch (error) {
      console.error('Error submitting activity:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add activity'
      });
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
    client?.name?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredProjectTypes = selectedClient?.projectTypes?.filter((pt: ProjectType) =>
    pt?.name?.toLowerCase().includes(projectTypeSearch.toLowerCase())
  ) || [];



  const filteredTaskTypes = taskTypes.filter(tt =>
    tt?.name?.toLowerCase().includes(taskTypeSearch.toLowerCase())
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

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F7F8FC]">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="mt-4 text-gray-500 text-sm">Loading daily tracker...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#F7F8FC]">
      {/* Header with Date Selector */}
      <View className="bg-white px-4 py-3 border-b border-gray-100 shadow-sm">

        {/* Date Navigation */}
        <View className="flex-row items-center justify-between mt-1">
          <TouchableOpacity
            onPress={() => {
              const prevDate = new Date(selectedDate);
              prevDate.setDate(prevDate.getDate() - 1);
              setSelectedDate(prevDate.toISOString().split('T')[0]);
            }}
            className="p-2 bg-violet-50 rounded-xl"
          >
            <ChevronLeft size={20} color="#7C3AED" />
          </TouchableOpacity>

          <Text className="text-[14px] font-bold text-[#1A1D2E]">
            {formatDate(selectedDate)} - {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric'
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
            className="p-2 bg-violet-50 rounded-xl"
            disabled={selectedDate >= new Date().toISOString().split('T')[0]}
            style={{ opacity: selectedDate >= new Date().toISOString().split('T')[0] ? 0.3 : 1 }}
          >
            <ChevronRight size={20} color="#7C3AED" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 py-4">
        {/* Add Activity Form */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
          <Text className="text-base font-bold text-[#1A1D2E] mb-4">Add New Activity</Text>

          {/* Client Selection with Autocomplete */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Client</Text>
          <TouchableOpacity
            onPress={() => setShowClientDropdown(true)}
            className="border border-gray-200 rounded-xl p-3 mb-4 flex-row items-center justify-between bg-[#F7F8FC]"
          >
            <Text className={selectedClient ? 'text-[#1A1D2E] font-medium' : 'text-gray-400'}>
              {selectedClient ? selectedClient.name : 'Choose a client...'}
            </Text>
            <ChevronDown size={18} color="#8890A8" />
          </TouchableOpacity>

          {/* Project Type Selection */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Project Type</Text>
          <TouchableOpacity
            onPress={() => setShowProjectTypeDropdown(true)}
            className="border border-gray-200 rounded-xl p-3 mb-4 flex-row items-center justify-between bg-[#F7F8FC]"
            disabled={!selectedClient}
            style={{ opacity: selectedClient ? 1 : 0.6 }}
          >
            <Text className={selectedProjectType ? 'text-[#1A1D2E] font-medium' : 'text-gray-400'}>
              {selectedProjectType ? selectedProjectType.name : selectedClient ? 'Choose project type...' : 'Select client first'}
            </Text>
            <ChevronDown size={18} color={selectedClient ? "#8890A8" : "#D1D5DB"} />
          </TouchableOpacity>

          {/* Task Type Selection */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Task Type</Text>
          <TouchableOpacity
            onPress={() => setShowTaskTypeDropdown(true)}
            className="border border-gray-200 rounded-xl p-3 mb-4 flex-row items-center justify-between bg-[#F7F8FC]"
          >
            <Text className={selectedTaskType ? 'text-[#1A1D2E] font-medium' : 'text-gray-400'}>
              {selectedTaskType ? selectedTaskType.name : 'Choose task type...'}
            </Text>
            <ChevronDown size={18} color="#8890A8" />
          </TouchableOpacity>

          {/* Activity Input */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Activity Details</Text>
          <TextInput
            className="border border-gray-200 rounded-xl p-3 mb-4 text-[#1A1D2E] bg-[#F7F8FC]"
            placeholder="Describe your activity..."
            placeholderTextColor="#8890A8"
            value={activityText}
            onChangeText={setActivityText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitActivity}
            disabled={submitting || !selectedClient || !selectedProjectType || !selectedTaskType || !activityText.trim()}
            className={`rounded-xl p-3.5 flex-row items-center justify-center ${submitting || !selectedClient || !selectedProjectType || !selectedTaskType || !activityText.trim()
              ? 'bg-gray-200'
              : 'bg-[#7C3AED]'
              }`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Plus size={18} color="white" />
                <Text className="text-white font-bold text-sm ml-2">Add Activity</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Activities for Selected Date */}
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-[#1A1D2E]">
              Activities for {formatDate(selectedDate)}
            </Text>
            {refreshing && (
              <ActivityIndicator size="small" color="#7C3AED" />
            )}
          </View>

          {activities.length === 0 ? (
            <View className="items-center py-10">
              <View className="bg-violet-50 p-4 rounded-full mb-3">
                <Clock size={32} color="#7C3AED" />
              </View>
              <Text className="text-gray-400 text-xs text-center">No activities logged for {formatDate(selectedDate)}</Text>
            </View>
          ) : (
            activities.map((activity, index) => (
              <TouchableOpacity
                key={activity._id}
                className="mb-4 last:mb-0"
                onPress={() => {
                  setSelectedActivity(activity);
                  setShowActivityDetail(true);
                }}
              >
                <View className="flex-row items-start">
                  <View className="w-2.5 h-2.5 bg-[#7C3AED] rounded-full mt-1.5 mr-3" />
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1.5">
                      <Text className="font-semibold text-[#1A1D2E] text-sm">
                        {activity.client?.name || 'Unknown Client'}
                      </Text>
                      <Text className="text-xs text-[#8890A8]">
                        {formatTime(activity.createdAt)}
                      </Text>
                    </View>
                    {(activity.projectType || activity.taskType) && (
                      <View className="flex-row mb-2">
                        {activity.projectType && (
                          <View className="bg-violet-50 px-2 py-0.5 rounded-full mr-2">
                            <Text className="text-[10px] font-semibold text-violet-700">
                              {activity.projectType.name}
                            </Text>
                          </View>
                        )}
                        {activity.taskType && (
                          <View className="bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Text className="text-[10px] font-semibold text-emerald-700">
                              {activity.taskType.name}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    <Text className="text-gray-700 text-xs leading-5">
                      {truncateText(activity.activity)}
                    </Text>
                  </View>
                </View>
                {index < activities.length - 1 && (
                  <View className="ml-5 mt-4 border-b border-gray-50" />
                )}
              </TouchableOpacity>
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
          <View className="bg-white rounded-t-[28px] max-h-[85%] pb-6">
            <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-1 mt-3" />
            
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-[#1A1D2E]">Select Client</Text>
                <TouchableOpacity onPress={() => setShowClientDropdown(false)} className="p-1">
                  <X size={20} color="#8890A8" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center bg-[#F7F8FC] border border-gray-100 rounded-xl px-3 py-2">
                <View className="mr-2">
                  <Search size={18} color="#8890A8" />
                </View>
                <TextInput
                  className="flex-1 text-[#1A1D2E] text-sm p-0"
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChangeText={setClientSearch}
                  placeholderTextColor="#8890A8"
                />
                {clientSearch ? (
                  <TouchableOpacity onPress={() => setClientSearch('')}>
                    <X size={18} color="#8890A8" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const projectTypesResponse = await axiosInstance.get(`/populate/read/clients/${item._id}?populateFields={"projectTypes":"name"}`);
                      const projectTypesData = projectTypesResponse.data.data?.projectTypes || [];
                      const updatedClient = {
                        ...item,
                        projectTypes: projectTypesData
                      };
                      setSelectedClient(updatedClient);
                    } catch (error) {
                      setSelectedClient(item);
                    }
                    setSelectedProjectType(null);
                    setClientSearch('');
                    setShowClientDropdown(false);
                  }}
                  className="p-4 border-b border-gray-50 flex-row items-center"
                >
                  <Text className="text-[#1A1D2E] font-semibold text-sm">{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="p-8 items-center">
                  <Text className="text-gray-400 text-xs">No clients found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Project Type Selection Modal */}
      <Modal
        visible={showProjectTypeDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProjectTypeDropdown(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[28px] max-h-[85%] pb-6">
            <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-1 mt-3" />
            
            <View className="p-4 border-b border-gray-100">
               <View className="flex-row items-center justify-between mb-3">
                 <Text className="text-lg font-bold text-[#1A1D2E]">Select Project Type</Text>
                 <TouchableOpacity onPress={() => setShowProjectTypeDropdown(false)} className="p-1">
                   <X size={20} color="#8890A8" />
                 </TouchableOpacity>
               </View>

               <View className="flex-row items-center bg-[#F7F8FC] border border-gray-100 rounded-xl px-3 py-2">
                 <View className="mr-2">
                   <Search size={18} color="#8890A8" />
                 </View>
                 <TextInput
                   className="flex-1 text-[#1A1D2E] text-sm p-0"
                   placeholder="Search project types..."
                   value={projectTypeSearch}
                   onChangeText={setProjectTypeSearch}
                   placeholderTextColor="#8890A8"
                 />
                 {projectTypeSearch ? (
                   <TouchableOpacity onPress={() => setProjectTypeSearch('')}>
                     <X size={18} color="#8890A8" />
                   </TouchableOpacity>
                 ) : null}
               </View>
            </View>

            <FlatList
              data={filteredProjectTypes}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedProjectType(item);
                    setProjectTypeSearch('');
                    setShowProjectTypeDropdown(false);
                  }}
                  className="p-4 border-b border-gray-50 flex-row items-center"
                >
                  <Text className="text-[#1A1D2E] font-semibold text-sm">{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="p-8 items-center">
                  <Text className="text-gray-400 text-xs">No project types found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Task Type Selection Modal */}
      <Modal
        visible={showTaskTypeDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTaskTypeDropdown(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[28px] max-h-[85%] pb-6">
            <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-1 mt-3" />
            
            <View className="p-4 border-b border-gray-100">
               <View className="flex-row items-center justify-between mb-3">
                 <Text className="text-lg font-bold text-[#1A1D2E]">Select Task Type</Text>
                 <TouchableOpacity onPress={() => setShowTaskTypeDropdown(false)} className="p-1">
                   <X size={20} color="#8890A8" />
                 </TouchableOpacity>
               </View>

               <View className="flex-row items-center bg-[#F7F8FC] border border-gray-100 rounded-xl px-3 py-2">
                 <View className="mr-2">
                   <Search size={18} color="#8890A8" />
                 </View>
                 <TextInput
                   className="flex-1 text-[#1A1D2E] text-sm p-0"
                   placeholder="Search task types..."
                   value={taskTypeSearch}
                   onChangeText={setTaskTypeSearch}
                   placeholderTextColor="#8890A8"
                 />
                 {taskTypeSearch ? (
                   <TouchableOpacity onPress={() => setTaskTypeSearch('')}>
                     <X size={18} color="#8890A8" />
                   </TouchableOpacity>
                 ) : null}
               </View>
            </View>

            <FlatList
              data={filteredTaskTypes}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedTaskType(item);
                    setTaskTypeSearch('');
                    setShowTaskTypeDropdown(false);
                  }}
                  className="p-4 border-b border-gray-50 flex-row items-center"
                >
                  <Text className="text-[#1A1D2E] font-semibold text-sm">{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="p-8 items-center">
                  <Text className="text-gray-400 text-xs">No task types found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Activity Detail Modal */}
      <Modal
        visible={showActivityDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActivityDetail(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-150 shadow-xl">
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <Text className="text-base font-bold text-[#1A1D2E]">Activity Details</Text>
              <TouchableOpacity onPress={() => setShowActivityDetail(false)} className="p-1">
                <X size={20} color="#8890A8" />
              </TouchableOpacity>
            </View>

            {selectedActivity && (
              <ScrollView className="max-h-96">
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-500 mb-1">Client</Text>
                  <Text className="text-lg font-semibold text-gray-900">
                    {selectedActivity.client?.name || 'Unknown Client'}
                  </Text>
                </View>

                {selectedActivity.projectType && (
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-500 mb-1">Project Type</Text>
                    <Text className="text-base text-gray-900">
                      {selectedActivity.projectType.name}
                    </Text>
                  </View>
                )}

                {selectedActivity.taskType && (
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-500 mb-1">Task Type</Text>
                    <Text className="text-base text-gray-900">
                      {selectedActivity.taskType.name}
                    </Text>
                  </View>
                )}

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-500 mb-1">Activity Date</Text>
                  <Text className="text-base text-gray-900">
                    {new Date(selectedActivity.date).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-500 mb-1">Created On</Text>
                  <Text className="text-base text-gray-900">
                    {new Date(selectedActivity.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })} at {formatTime(selectedActivity.createdAt)}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-500 mb-2">Activity Description</Text>
                  <Text className="text-base text-gray-900 leading-6">
                    {selectedActivity.activity}
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}