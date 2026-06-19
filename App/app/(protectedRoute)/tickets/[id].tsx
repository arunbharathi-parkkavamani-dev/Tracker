import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import axiosInstance from '@/api/axiosInstance';
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  Send,
  ArrowLeft,
  Flag,
  CheckCircle2,
  Bookmark,
  Layers
} from 'lucide-react-native';

interface Comment {
  comment: string;
  commentedBy: {
    _id: string;
    basicInfo?: {
      firstName?: string;
      lastName?: string;
    };
  } | any;
  commentedAt: string;
  isPublic?: boolean;
}

interface TicketDetail {
  _id: string;
  ticketId: string;
  title: string;
  userStory?: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
  dueDate?: string;
  createdAt: string;
  createdBy?: any;
  assignedTo?: any[];
  comments?: Comment[];
}

const PRIORITY_COLORS = {
  Critical: { bg: '#FEE2E2', text: '#B91C1C' },
  High: { bg: '#FFEDD5', text: '#C2410C' },
  Medium: { bg: '#FEF9C3', text: '#A16207' },
  Low: { bg: '#F0FDF4', text: '#166534' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Open': { bg: '#EDE9FE', text: '#7C3AED' },
  'In Progress': { bg: '#DBEAFE', text: '#1E40AF' },
  'Review': { bg: '#EDE9FE', text: '#7C3AED' },
  'Testing': { bg: '#E0F2FE', text: '#0EA5E9' },
  'Completed': { bg: '#D1FAE5', text: '#065F46' },
  'Closed': { bg: '#F1F5F9', text: '#475569' },
};

export default function TicketDetails() {
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [updatingField, setUpdatingField] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      const populateFields = {
        'clientId': 'name',
        'type': 'name',
        'createdBy': 'basicInfo.firstName,basicInfo.lastName',
        'assignedTo': 'basicInfo.firstName,basicInfo.lastName',
        'comments.commentedBy': 'basicInfo.firstName,basicInfo.lastName',
        'linkedTaskId': 'title,status',
      };
      const res = await axiosInstance.get(
        `/populate/read/tickets/${id}?populateFields=${encodeURIComponent(JSON.stringify(populateFields))}`
      );
      setTicket(res.data?.data || null);
    } catch (error) {
      console.error('Error loading ticket details:', error);
      Alert.alert('Error', 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketField = async (field: string, value: any) => {
    setUpdatingField(true);
    try {
      await axiosInstance.put(`/populate/update/tickets/${id}`, { [field]: value });
      // Refresh state
      await fetchTicketDetails();
    } catch (error: any) {
      console.error(`Error updating ticket ${field}:`, error);
      Alert.alert('Update Failed', error.response?.data?.message || 'Failed to update field');
    } finally {
      setUpdatingField(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const commentPayload = {
        comment: newComment,
        commentedBy: user?.id,
        isPublic: true,
        commentedAt: new Date()
      };
      await axiosInstance.put(`/populate/update/tickets/${id}`, {
        $push: { comments: commentPayload }
      });
      setNewComment('');
      await fetchTicketDetails();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F7F8FC]">
        <ActivityIndicator size="large" color="#E11D48" />
        <Text className="mt-2 text-gray-500 text-sm">Loading ticket details...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F7F8FC] p-4">
        <Text className="text-gray-500 font-medium">Ticket not found or deleted.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-gray-200 px-4 py-2 rounded-xl"
        >
          <Text className="text-gray-800 font-bold text-sm">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priorityStyle = PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.Medium;
  const statusStyle = STATUS_COLORS[ticket.status] || { bg: '#F3F4F6', text: '#4B5563' };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-[#F7F8FC]">
        {/* Sub Header / Action Row */}
        <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-1">
            <ArrowLeft size={20} color="#8890A8" />
            <Text className="text-sm font-semibold text-[#8890A8]">Back</Text>
          </TouchableOpacity>
          <Text className="text-xs font-semibold text-gray-400">
            {ticket.ticketId || 'TKT-PENDING'}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          {/* Main Card */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            {/* Title */}
            <Text className="text-lg font-bold text-[#1A1D2E] mb-3">{ticket.title}</Text>

            {/* Badges / Chips */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              <View style={{ backgroundColor: priorityStyle.bg }} className="px-3 py-1 rounded-full">
                <Text style={{ color: priorityStyle.text }} className="text-xs font-semibold">
                  {ticket.priority} Priority
                </Text>
              </View>

              <View style={{ backgroundColor: statusStyle.bg }} className="px-3 py-1 rounded-full">
                <Text style={{ color: statusStyle.text }} className="text-xs font-semibold">
                  {ticket.status}
                </Text>
              </View>
            </View>

            {/* Details Grid */}
            <View className="border-t border-gray-50 pt-4 gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <User size={16} color="#8890A8" />
                  <Text className="text-xs text-gray-500 font-medium">Raised By</Text>
                </View>
                <Text className="text-xs font-semibold text-gray-800">
                  {ticket.createdBy?.basicInfo?.firstName
                    ? `${ticket.createdBy.basicInfo.firstName} ${ticket.createdBy.basicInfo.lastName || ''}`
                    : 'System'}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Calendar size={16} color="#8890A8" />
                  <Text className="text-xs text-gray-500 font-medium">Due Date</Text>
                </View>
                <Text className="text-xs font-semibold text-gray-800">
                  {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString('en-IN') : 'Not Set'}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Layers size={16} color="#8890A8" />
                  <Text className="text-xs text-gray-500 font-medium">Assigned To</Text>
                </View>
                <Text className="text-xs font-semibold text-indigo-600">
                  {ticket.assignedTo && ticket.assignedTo.length > 0
                    ? ticket.assignedTo.map(a => `${a.basicInfo?.firstName || ''}`).join(', ')
                    : 'Unassigned'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Panel */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Update Status</Text>
            <View className="flex-row flex-wrap gap-2">
              {['Open', 'In Progress', 'Testing', 'Completed', 'Closed'].map((s) => {
                const isActive = ticket.status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    disabled={updatingField}
                    onPress={() => updateTicketField('status', s)}
                    className={`px-3 py-2 rounded-xl border ${
                      isActive
                        ? 'bg-[#E11D48]/10 border-[#E11D48]/30'
                        : 'bg-transparent border-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isActive ? 'text-[#E11D48]' : 'text-gray-600'
                      }`}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description Section */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</Text>
            <Text className="text-sm text-gray-700 leading-relaxed">
              {ticket.description || ticket.userStory || 'No description provided.'}
            </Text>
          </View>

          {/* Comments Section */}
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Comments</Text>

            {/* Comments List */}
            <View className="gap-4 mb-4">
              {!ticket.comments || ticket.comments.length === 0 ? (
                <Text className="text-xs text-gray-400 italic text-center py-2">No comments posted yet.</Text>
              ) : (
                ticket.comments.map((comment, i) => {
                  const commenterName = comment.commentedBy?.basicInfo?.firstName
                    ? `${comment.commentedBy.basicInfo.firstName} ${comment.commentedBy.basicInfo.lastName || ''}`
                    : 'User';
                  return (
                    <View key={i} className="flex-row gap-3">
                      <View className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center">
                        <Text className="text-[#E11D48] text-xs font-bold">
                          {commenterName.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1 bg-[#F7F8FC] rounded-2xl p-3 border border-gray-50">
                        <View className="flex-row justify-between items-center mb-1">
                          <Text className="text-xs font-bold text-[#1A1D2E]">{commenterName}</Text>
                          <Text className="text-[10px] text-gray-400">
                            {new Date(comment.commentedAt).toLocaleDateString('en-IN', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-700 leading-normal">{comment.comment}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* New Comment Input */}
            <View className="flex-row items-center border border-gray-100 bg-[#F7F8FC] rounded-xl px-3 py-2">
              <TextInput
                placeholder="Write a comment..."
                value={newComment}
                onChangeText={setNewComment}
                placeholderTextColor="#8890A8"
                multiline
                className="flex-1 text-xs text-[#1A1D2E] max-h-16 p-0"
              />
              <TouchableOpacity
                disabled={sendingComment || !newComment.trim()}
                onPress={handleAddComment}
                className="p-1"
              >
                {sendingComment ? (
                  <ActivityIndicator size="small" color="#E11D48" />
                ) : (
                  <Send size={18} color={newComment.trim() ? '#E11D48' : '#8890A8'} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
