import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import InlineEdit from '@/components/InlineEdit';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    if (taskParam) {
      try {
        const parsedTask = JSON.parse(taskParam as string);
        setTask(parsedTask);
        setLoading(false);
        fetchComments(parsedTask);
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
      
      const taskData = response.data.data;
      setTask(taskData);
      fetchComments(taskData);
      fetchEmployees();
    } catch (error) {
      console.error('Error fetching task details:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (taskData: Task) => {
    if (!taskData.commentsThread) return;
    
    try {
      const threadId = typeof taskData.commentsThread === 'object' ? taskData.commentsThread._id : taskData.commentsThread;
      if (!threadId) return;
      
      const populateFields = {
        "comments.commentedBy": "basicInfo.firstName,basicInfo.lastName"
      };
      
      const response = await axiosInstance.get(
        `/populate/read/commentsthreads/${threadId}?populateFields=${encodeURIComponent(JSON.stringify(populateFields))}`
      );
      
      const commentsWithUsers = await Promise.all(
        (response.data.data?.comments || []).map(async (comment: any) => {
          if (typeof comment.commentedBy === 'string') {
            try {
              const userResponse = await axiosInstance.get(`/populate/read/employees/${comment.commentedBy}?fields=basicInfo.firstName,basicInfo.lastName`);
              return {
                ...comment,
                commentedBy: userResponse.data.data
              };
            } catch (error) {
              return comment;
            }
          }
          return comment;
        })
      );
      
      setComments(commentsWithUsers);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    
    setAddingComment(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;
      
      const decoded = jwtDecode(token);
      const userId = decoded.userId || decoded.id;
      
      let threadId = task?.commentsThread;
      
      if (!threadId) {
        const threadResponse = await axiosInstance.post('/populate/create/commentsthreads', {
          taskId: task?._id,
          comments: []
        });
        threadId = threadResponse.data.data._id;
        
        await axiosInstance.put(`/update/tasks/${task?._id}`, {
          commentsThread: threadId
        });
      }

      const finalThreadId = typeof threadId === 'object' ? threadId._id : threadId;
      await axiosInstance.put(`/update/commentsthreads/${finalThreadId}`, {
        $push: {
          comments: {
            commentedBy: userId,
            message: newComment,
            mentions: []
          }
        }
      });

      setNewComment('');
      if (task) fetchComments(task);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Comment added successfully'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add comment'
      });
    } finally {
      setAddingComment(false);
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

  const handleCommentChange = (text: string) => {
    console.log('Comment text:', text);
    setNewComment(text);
    
    const lastAtIndex = text.lastIndexOf('@');
    console.log('Last @ index:', lastAtIndex);
    
    if (lastAtIndex !== -1) {
      const textAfterAt = text.substring(lastAtIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');
      
      console.log('Text after @:', textAfterAt);
      console.log('Space index:', spaceIndex);
      
      if (spaceIndex === -1) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        console.log('Showing mentions, query:', textAfterAt);
      } else {
        setShowMentions(false);
        console.log('Hiding mentions - space found');
      }
    } else {
      setShowMentions(false);
      console.log('Hiding mentions - no @ found');
    }
  };

  const selectMention = (employee: any) => {
    const lastAtIndex = newComment.lastIndexOf('@');
    const beforeAt = newComment.substring(0, lastAtIndex);
    const afterMention = newComment.substring(lastAtIndex + 1 + mentionQuery.length);
    const mentionText = `@${employee.basicInfo?.firstName} ${employee.basicInfo?.lastName}`;
    
    setNewComment(beforeAt + mentionText + ' ' + afterMention);
    setShowMentions(false);
    setMentionQuery('');
  };

  const filteredEmployees = employees.filter((emp: any) => {
    const fullName = `${emp.basicInfo?.firstName || ''} ${emp.basicInfo?.lastName || ''}`.toLowerCase();
    return fullName.includes(mentionQuery.toLowerCase());
  });
  
  console.log('Employees count:', employees.length);
  console.log('Filtered employees count:', filteredEmployees.length);
  console.log('Show mentions:', showMentions);
  console.log('Mention query:', mentionQuery);

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

  const updateTaskField = async (field: string, value: string) => {
    try {
      await axiosInstance.put(`/update/tasks/${task?._id}`, {
        [field]: value
      });
      
      setTask(prev => prev ? { ...prev, [field]: value } : null);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Task updated successfully'
      });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update task'
      });
      throw error;
    }
  };

  const InfoSection = ({ title, content, field }: { title: string; content: string; field?: string }) => (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-900 mb-2">{title}</Text>
      {field ? (
        <InlineEdit
          value={content}
          onSave={(newValue) => updateTaskField(field, newValue)}
          multiline={true}
          placeholder={`Enter ${title.toLowerCase()}...`}
        />
      ) : (
        <Text className="text-gray-700 leading-6">{content || 'Not specified'}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAwareScrollView 
        className="flex-1"
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
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
        
        <InlineEdit
          value={task.title}
          onSave={(value) => updateTaskField('title', value)}
          textStyle={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: 8
          }}
        />
        
        {/* Assignees */}
        <View className="flex-row items-center">
          <Text className="text-sm text-gray-600 mr-2">Assigned to:</Text>
          {task.assignedTo?.filter(Boolean).length > 0 ? (
            <Text className="text-sm text-gray-700">
              {task.assignedTo.filter(Boolean).length === 1 
                ? (typeof task.assignedTo.filter(Boolean)[0] === 'object' 
                   ? task.assignedTo.filter(Boolean)[0]?.basicInfo?.firstName || 'User'
                   : 'User')
                : `${task.assignedTo.filter(Boolean).length} users`
              }
            </Text>
          ) : (
            <Text className="text-sm text-gray-500">No one assigned</Text>
          )}
        </View>
      </View>

      {/* Content */}
      <View className="px-4 py-6">
        <InfoSection title="User Story" content={task.userStory} field="userStory" />
        <InfoSection title="Observation" content={task.observation} field="observation" />
        <InfoSection title="Acceptance Criteria" content={task.acceptanceCreteria} field="acceptanceCreteria" />
        
        {/* Comments Section */}
        <View className="mt-8 border-t pt-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Comments</Text>
          
          {/* Comments List */}
          <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
            {comments.length > 0 ? (
              comments.map((comment: any, index: number) => (
                <View key={index} className="flex-row mb-4 last:mb-0">
                  <View 
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#3B82F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                      {comment.commentedBy?.basicInfo?.firstName?.charAt(0) || 'U'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="font-medium text-gray-900 mr-2">
                        {comment.commentedBy?.basicInfo?.firstName} {comment.commentedBy?.basicInfo?.lastName}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="text-gray-700">{comment.message}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-gray-500 text-center py-4">No comments yet</Text>
            )}
          </View>
          
          {/* Add Comment */}
          <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <View style={{ position: 'relative' }}>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-3 text-gray-900"
                placeholder="Add a comment... (use @ to mention someone)"
                value={newComment}
                onChangeText={handleCommentChange}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              
              {/* Mentions Dropdown */}
              {showMentions && filteredEmployees.length > 0 && (
                <View style={{
                  position: 'absolute',
                  bottom: 100,
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  maxHeight: 150,
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84
                }}>
                  <ScrollView nestedScrollEnabled={true}>
                    {filteredEmployees.slice(0, 5).map((employee: any) => (
                      <TouchableOpacity
                        key={employee._id}
                        onPress={() => selectMention(employee)}
                        style={{
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: '#F3F4F6',
                          flexDirection: 'row',
                          alignItems: 'center'
                        }}
                      >
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: '#3B82F6',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 8
                        }}>
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                            {employee.basicInfo?.firstName?.charAt(0) || 'U'}
                          </Text>
                        </View>
                        <Text style={{ color: '#374151' }}>
                          {employee.basicInfo?.firstName} {employee.basicInfo?.lastName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              onPress={addComment}
              disabled={!newComment.trim() || addingComment}
              style={{
                backgroundColor: newComment.trim() && !addingComment ? '#3B82F6' : '#D1D5DB',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 6,
                alignSelf: 'flex-end'
              }}
            >
              <Text style={{ color: 'white', fontWeight: '500' }}>
                {addingComment ? 'Adding...' : 'Add Comment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Metadata */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mt-6">
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
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}