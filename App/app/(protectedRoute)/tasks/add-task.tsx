import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import Toast from 'react-native-toast-message';
import DropDownPicker from 'react-native-dropdown-picker';

interface Client {
  _id: string;
  name: string;
}

interface Employee {
  _id: string;
  basicInfo: {
    firstName: string;
    lastName: string;
  };
}

interface ProjectType {
  _id: string;
  name: string;
}

interface TaskType {
  _id: string;
  name: string;
}

export default function AddTask() {
  const [title, setTitle] = useState('');
  const [userStory, setUserStory] = useState('');
  const [observation, setObservation] = useState('');
  const [impacts, setImpacts] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [priorityLevel, setPriorityLevel] = useState('Low');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tags, setTags] = useState('');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [clientOpen, setClientOpen] = useState(false);
  const [projectTypeOpen, setProjectTypeOpen] = useState(false);
  const [taskTypeOpen, setTaskTypeOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  useEffect(() => {
    getCurrentUser();
    fetchClients();
    fetchEmployees();
    fetchProjectTypes();
    fetchTaskTypes();
  }, []);

  const getCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.userId || decoded.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/clients');
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/employees?fields=basicInfo.firstName,basicInfo.lastName');
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchProjectTypes = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/projecttypes');
      setProjectTypes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching project types:', error);
    }
  };

  const fetchTaskTypes = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/tasktypes');
      setTaskTypes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching task types:', error);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedClient || !selectedProjectType || !selectedTaskType || selectedAssignees.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title: title.trim(),
        userStory: userStory.trim(),
        observation: observation.trim(),
        impacts: impacts.trim(),
        acceptanceCreteria: acceptanceCriteria.trim(),
        referenceUrl: referenceUrl.trim(),
        clientId: selectedClient,
        projectTypeId: selectedProjectType,
        taskTypeId: selectedTaskType,
        createdBy: currentUserId,
        assignedTo: selectedAssignees,
        priorityLevel,
        startDate: startDate || null,
        endDate: endDate || null,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        status: 'Backlogs'
      };

      await axiosInstance.post('/populate/create/tasks', taskData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Task created successfully'
      });
      
      router.back();
    } catch (error) {
      console.error('Error creating task:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create task'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Create New Task</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 p-4" 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Task Details */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Task Details</Text>
          
          <Text className="text-sm font-medium text-gray-700 mb-2">Title *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
            placeholder="Enter task title"
            value={title}
            onChangeText={setTitle}
          />

          <Text className="text-sm font-medium text-gray-700 mb-2">User Story</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 h-20 mb-4"
            placeholder="As a user, I want..."
            value={userStory}
            onChangeText={setUserStory}
            multiline
            textAlignVertical="top"
          />

          <Text className="text-sm font-medium text-gray-700 mb-2">Observation</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 h-20 mb-4"
            placeholder="Current state observation"
            value={observation}
            onChangeText={setObservation}
            multiline
            textAlignVertical="top"
          />

          <Text className="text-sm font-medium text-gray-700 mb-2">Impacts</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 h-20 mb-4"
            placeholder="Expected impacts"
            value={impacts}
            onChangeText={setImpacts}
            multiline
            textAlignVertical="top"
          />

          <Text className="text-sm font-medium text-gray-700 mb-2">Acceptance Criteria</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 h-20 mb-4"
            placeholder="Acceptance criteria"
            value={acceptanceCriteria}
            onChangeText={setAcceptanceCriteria}
            multiline
            textAlignVertical="top"
          />

          <Text className="text-sm font-medium text-gray-700 mb-2">Reference URL</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="https://example.com"
            value={referenceUrl}
            onChangeText={setReferenceUrl}
          />
        </View>

        {/* Project & Task Type */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200" style={{ zIndex: 3000 }}>
          <Text className="text-lg font-semibold text-gray-900 mb-3">Project & Task Classification</Text>
          
          <Text className="text-sm font-medium text-gray-700 mb-2">Client *</Text>
          <View style={{ zIndex: 5000, elevation: 5000, position: 'relative' }}>
            <DropDownPicker
              open={clientOpen}
              value={selectedClient}
              items={clients.map(client => ({ label: client.name, value: client._id }))}
              setOpen={setClientOpen}
              setValue={setSelectedClient}
              placeholder="Select client"
              style={{ marginBottom: 16 }}
              listMode="SCROLLVIEW"
            />
          </View>

          <Text className="text-sm font-medium text-gray-700 mb-2">Project Type *</Text>
          <View style={{ zIndex: 4500, elevation: 4500, position: 'relative' }}>
            <DropDownPicker
              open={projectTypeOpen}
              value={selectedProjectType}
              items={projectTypes.map(type => ({ label: type.name, value: type._id }))}
              setOpen={setProjectTypeOpen}
              setValue={setSelectedProjectType}
              placeholder="Select project type"
              style={{ marginBottom: 16 }}
              listMode="SCROLLVIEW"
            />
          </View>

          <Text className="text-sm font-medium text-gray-700 mb-2">Task Type *</Text>
          <View style={{ zIndex: 4000, elevation: 4000, position: 'relative' }}>
            <DropDownPicker
              open={taskTypeOpen}
              value={selectedTaskType}
              items={taskTypes.map(type => ({ label: type.name, value: type._id }))}
              setOpen={setTaskTypeOpen}
              setValue={setSelectedTaskType}
              placeholder="Select task type"
              style={{ marginBottom: 16 }}
              listMode="SCROLLVIEW"
            />
          </View>
        </View>

        {/* Assignment */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200" style={{ zIndex: 2000 }}>
          <Text className="text-lg font-semibold text-gray-900 mb-3">Assignment</Text>
          
          <Text className="text-sm font-medium text-gray-700 mb-2">Assign To *</Text>
          <View style={{ zIndex: 3500, elevation: 3500, position: 'relative' }}>
            <DropDownPicker
              open={assigneeOpen}
              value={selectedAssignees}
              items={employees.map(emp => ({ 
                label: `${emp.basicInfo.firstName} ${emp.basicInfo.lastName}`, 
                value: emp._id 
              }))}
              setOpen={setAssigneeOpen}
              setValue={setSelectedAssignees}
              placeholder="Select assignees"
              multiple={true}
              mode="BADGE"
              style={{ marginBottom: 16 }}
              listMode="SCROLLVIEW"
            />
          </View>
        </View>

        {/* Task Settings */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200" style={{ zIndex: 1000 }}>
          <Text className="text-lg font-semibold text-gray-900 mb-3">Task Settings</Text>
          
          <Text className="text-sm font-medium text-gray-700 mb-2">Priority Level</Text>
          <View style={{ zIndex: 3000, elevation: 3000, position: 'relative' }}>
            <DropDownPicker
              open={priorityOpen}
              value={priorityLevel}
              items={[
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' },
                { label: 'Weekly Priority', value: 'Weekly Priority' }
              ]}
              setOpen={setPriorityOpen}
              setValue={setPriorityLevel}
              style={{ marginBottom: 16 }}
              listMode="SCROLLVIEW"
            />
          </View>

          <Text className="text-sm font-medium text-gray-700 mb-2">Start Date</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
            placeholder="YYYY-MM-DD"
            value={startDate}
            onChangeText={setStartDate}
          />

          <Text className="text-sm font-medium text-gray-700 mb-2">End Date</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
            placeholder="YYYY-MM-DD"
            value={endDate}
            onChangeText={setEndDate}
          />

          <Text className="text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="tag1, tag2, tag3"
            value={tags}
            onChangeText={setTags}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`rounded-lg p-4 flex-row items-center justify-center ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
        >
          <MaterialIcons name="add-task" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">
            {loading ? 'Creating...' : 'Create Task'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
}