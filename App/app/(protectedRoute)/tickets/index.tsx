import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import axiosInstance from '@/api/axiosInstance';
import { router } from 'expo-router';
import {
  Search,
  Plus,
  Ticket as TicketIcon,
  X,
  AlertCircle,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react-native';

interface TicketData {
  _id: string;
  ticketId: string;
  title: string;
  userStory?: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
  dueDate?: string;
  createdAt: string;
  type?: any;
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

export default function TicketsIndex() {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New ticket form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newType, setNewType] = useState('Bug');
  const [newProduct, setNewProduct] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0]; // Default: 7 days from now
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    if (!user?.id) return;
    try {
      const response = await axiosInstance.post('/populate/read/tickets', {
        fields: 'title,type,priority,status,dueDate,createdAt,assignedTo,createdBy,ticketId',
        limit: 1000
      });
      const items = response.data?.data || [];
      // Filter client-side where user is creator or assignee
      const filtered = items.filter((t: any) => {
        const creatorId = t.createdBy?._id || t.createdBy;
        const isCreator = creatorId === user.id;
        const isAssigned = Array.isArray(t.assignedTo) && t.assignedTo.some((a: any) => {
          const id = a?._id || a;
          return id === user.id;
        });
        return isCreator || isAssigned;
      });
      setTickets(filtered);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const handleCreateTicket = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a ticket title');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: newTitle,
        userStory: newDesc,
        priority: newPriority,
        type: newType,
        product: newProduct,
        dueDate: newDueDate,
        createdBy: user?.id,
        status: 'Open'
      };
      await axiosInstance.post('/populate/create/tickets', payload);
      Alert.alert('Success', 'Ticket created successfully');
      setShowCreateModal(false);
      // Reset form
      setNewTitle('');
      setNewDesc('');
      setNewPriority('Medium');
      setNewType('Bug');
      setNewProduct('');

      // Refresh list
      fetchTickets();
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const getFilteredTickets = () => {
    return tickets.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.ticketId && t.ticketId.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
      const matchesPriority = selectedPriority === 'All' || t.priority === selectedPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  // Stat calculations
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical').length;

  const renderTicketItem = ({ item }: { item: TicketData }) => {
    const priorityStyle = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.Medium;
    const statusStyle = STATUS_COLORS[item.status] || { bg: '#F3F4F6', text: '#4B5563' };
    const dateStr = item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short'
    }) : 'No due date';

    const typeName = item.type?.name || item.type || 'Support';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/tickets/${item._id}` as any)}
        className="bg-white rounded-2xl mb-3 shadow-sm border border-gray-100 flex-row overflow-hidden"
      >
        {/* Left vertical color accent bar for ticket system */}
        <View className="w-1.5 bg-[#E11D48]" />

        <View className="flex-1 p-4">
          <View className="flex-row justify-between items-start mb-1.5">
            <Text className="text-gray-400 text-[11px] font-semibold tracking-wider uppercase">
              {item.ticketId || 'TKT-PENDING'}
            </Text>
            <View className="flex-row gap-1">
              {/* Type Badge */}
              <View className="bg-indigo-50 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-semibold text-indigo-600">{typeName}</Text>
              </View>
              {/* Priority Badge */}
              <View style={{ backgroundColor: priorityStyle.bg }} className="px-2 py-0.5 rounded-full">
                <Text style={{ color: priorityStyle.text }} className="text-[10px] font-bold">
                  {item.priority}
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-sm font-semibold text-[#1A1D2E] mb-2" numberOfLines={2}>
            {item.title}
          </Text>

          <View className="flex-row justify-between items-center mt-1 pt-2 border-t border-gray-50">
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color="#8890A8" />
              <Text className="text-xs text-[#8890A8]">{dateStr}</Text>
            </View>

            <View style={{ backgroundColor: statusStyle.bg }} className="px-2.5 py-0.5 rounded-full">
              <Text style={{ color: statusStyle.text }} className="text-[10px] font-bold">
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredData = getFilteredTickets();

  return (
    <View className="flex-1 bg-[#F7F8FC]">
      {/* Mini Stats Bar */}
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row justify-between shadow-sm">
        <View className="items-center flex-1">
          <Text className="text-xs text-gray-400 font-medium">Total</Text>
          <Text className="text-lg font-bold text-gray-800">{totalCount}</Text>
        </View>
        <View className="w-[1px] bg-gray-100 my-1" />
        <View className="items-center flex-1">
          <Text className="text-xs text-gray-400 font-medium">Open</Text>
          <Text className="text-lg font-bold text-violet-600">{openCount}</Text>
        </View>
        <View className="w-[1px] bg-gray-100 my-1" />
        <View className="items-center flex-1">
          <Text className="text-xs text-gray-400 font-medium">In Progress</Text>
          <Text className="text-lg font-bold text-blue-600">{inProgressCount}</Text>
        </View>
        <View className="w-[1px] bg-gray-100 my-1" />
        <View className="items-center flex-1">
          <Text className="text-xs text-gray-400 font-medium">Critical</Text>
          <Text className="text-lg font-bold text-red-600">{criticalCount}</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View className="px-4 pt-3 pb-2 gap-2">
        <View className="flex-row items-center bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
          <View className="mr-2">
            <Search size={18} color="#8890A8" />
          </View>
          <TextInput
            placeholder="Search by ticket ID or title..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8890A8"
            className="flex-1 text-[#1A1D2E] text-sm p-0"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#8890A8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Scrollable Filters */}
        <View className="gap-2">
          {/* Status Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-0.5">
            {['All', 'Open', 'In Progress', 'Review', 'Testing', 'Completed', 'Closed'].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSelectedStatus(s)}
                className={`rounded-lg px-3 py-1.5 mr-2 border shadow-sm ${selectedStatus === s
                    ? 'bg-[#E11D48] border-[#E11D48]'
                    : 'bg-white border-gray-100'
                  }`}
              >
                <Text
                  className={`text-xs font-semibold ${selectedStatus === s ? 'text-white' : 'text-[#8890A8]'
                    }`}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Priority Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-0.5">
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setSelectedPriority(p)}
                className={`rounded-lg px-3 py-1.5 mr-2 border shadow-sm ${selectedPriority === p
                    ? 'bg-[#E11D48] border-[#E11D48]'
                    : 'bg-white border-gray-100'
                  }`}
              >
                <Text
                  className={`text-xs font-semibold ${selectedPriority === p ? 'text-white' : 'text-[#8890A8]'
                    }`}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Tickets List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E11D48" />
          <Text className="mt-2 text-gray-500 text-sm">Loading tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, paddingTop: 4 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E11D48" />
          }
          ListEmptyComponent={
            <View className="py-12 items-center justify-center">
              <View className="bg-rose-50 p-4 rounded-full mb-3">
                <TicketIcon size={32} color="#E11D48" />
              </View>
              <Text className="text-gray-800 font-bold text-base mb-1">No Tickets Found</Text>
              <Text className="text-gray-400 text-xs text-center max-w-[250px]">
                There are no tickets matching your filters or assigned to you.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setShowCreateModal(true)}
        className="absolute bottom-6 right-6 bg-[#E11D48] w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Create Ticket Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[28px] max-h-[85%] p-5">
            {/* Header */}
            <View className="flex-row justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <Text className="text-lg font-bold text-[#1A1D2E]">Raise New Ticket</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} className="p-1">
                <X size={20} color="#8890A8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
              {/* Title Input */}
              <View className="gap-1">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title *</Text>
                <TextInput
                  placeholder="Summarize the problem..."
                  value={newTitle}
                  onChangeText={setNewTitle}
                  className="bg-[#F7F8FC] border border-gray-100 rounded-xl px-4 py-3 text-[#1A1D2E] text-sm"
                  placeholderTextColor="#8890A8"
                />
              </View>

              {/* Description Input */}
              <View className="gap-1 mt-3">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</Text>
                <TextInput
                  placeholder="Detailed explanation of the issue, steps to reproduce, or support requirements..."
                  value={newDesc}
                  onChangeText={setNewDesc}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-[#F7F8FC] border border-gray-100 rounded-xl px-4 py-3 text-[#1A1D2E] text-sm h-28"
                  placeholderTextColor="#8890A8"
                />
              </View>

              {/* Product Input */}
              <View className="gap-1 mt-3">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product / Project</Text>
                <TextInput
                  placeholder="Product name (optional)"
                  value={newProduct}
                  onChangeText={setNewProduct}
                  className="bg-[#F7F8FC] border border-gray-100 rounded-xl px-4 py-3 text-[#1A1D2E] text-sm"
                  placeholderTextColor="#8890A8"
                />
              </View>

              {/* Priority Selector */}
              <View className="gap-1 mt-3">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</Text>
                <View className="flex-row justify-between bg-[#F7F8FC] p-1 rounded-xl border border-gray-100">
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setNewPriority(p)}
                      className={`flex-1 items-center py-2.5 rounded-lg ${newPriority === p ? 'bg-white shadow-sm' : 'bg-transparent'
                        }`}
                    >
                      <Text
                        className={`text-xs font-bold ${newPriority === p ? 'text-[#E11D48]' : 'text-gray-500'
                          }`}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Type Selector */}
              <View className="gap-1 mt-3">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</Text>
                <View className="flex-row justify-between bg-[#F7F8FC] p-1 rounded-xl border border-gray-100">
                  {['Bug', 'Feature', 'Enhancement', 'Support'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setNewType(t)}
                      className={`flex-1 items-center py-2.5 rounded-lg ${newType === t ? 'bg-white shadow-sm' : 'bg-transparent'
                        }`}
                    >
                      <Text
                        className={`text-xs font-bold ${newType === t ? 'text-indigo-600' : 'text-gray-500'
                          }`}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Due Date (Plain Text Input for simplicity & safety) */}
              <View className="gap-1 mt-3">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date (YYYY-MM-DD)</Text>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  value={newDueDate}
                  onChangeText={setNewDueDate}
                  className="bg-[#F7F8FC] border border-gray-100 rounded-xl px-4 py-3 text-[#1A1D2E] text-sm"
                  placeholderTextColor="#8890A8"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCreateTicket}
                disabled={creating}
                className="bg-[#E11D48] rounded-xl py-3.5 items-center justify-center mt-5 mb-4 shadow-sm"
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text className="text-white font-bold text-sm">Submit Ticket</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
