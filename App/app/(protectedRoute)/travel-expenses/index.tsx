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
import {
  Plane,
  Plus,
  Trash2,
  Calendar,
  Layers,
  X,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';

interface ExpenseLine {
  expenseType: 'travel' | 'accommodation' | 'food' | 'miscellaneous';
  amount: string;
  description: string;
}

interface ExpenseRecord {
  _id: string;
  date: string;
  clientId: {
    _id: string;
    name: string;
  } | any;
  expenses: {
    expenseType: string;
    amount: number;
    description: string;
    _id?: string;
  }[];
  dayTotal: number;
  totalExpenses: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Client {
  _id: string;
  name: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: '#D1FAE5', text: '#065F46' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C' },
  pending: { bg: '#FEF3C7', text: '#92400E' },
};

const EXPENSE_TYPES = [
  { value: 'travel', label: 'Travel' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'food', label: 'Food' },
  { value: 'miscellaneous', label: 'Misc' },
];

export default function TravelExpenses() {
  const { user } = useContext(AuthContext);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New expense form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [expenseLines, setExpenseLines] = useState<ExpenseLine[]>([
    { expenseType: 'travel', amount: '', description: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState('Select Client');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchClients();
  }, []);

  const fetchExpenses = async () => {
    if (!user?.id) return;
    try {
      const res = await axiosInstance.post('/populate/read/expenses', {
        filter: { employeeId: user.id },
        sort: { createdAt: -1 },
        limit: 100
      });
      setExpenses(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axiosInstance.post('/populate/read/clients');
      setClients(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const addExpenseLine = () => {
    setExpenseLines([...expenseLines, { expenseType: 'travel', amount: '', description: '' }]);
  };

  const removeExpenseLine = (index: number) => {
    if (expenseLines.length === 1) return;
    setExpenseLines(expenseLines.filter((_, i) => i !== index));
  };

  const updateLineField = (index: number, field: keyof ExpenseLine, value: string) => {
    setExpenseLines(
      expenseLines.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };

  const handleCreateExpense = async () => {
    if (!selectedClientId) {
      Alert.alert('Validation Error', 'Please select a client');
      return;
    }

    // Validate expense lines
    for (let i = 0; i < expenseLines.length; i++) {
      const line = expenseLines[i];
      if (!line.amount || isNaN(Number(line.amount)) || Number(line.amount) <= 0) {
        Alert.alert('Validation Error', `Please enter a valid amount for entry #${i + 1}`);
        return;
      }
      if (!line.description.trim()) {
        Alert.alert('Validation Error', `Please enter a description for entry #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formattedLines = expenseLines.map((line) => ({
        expenseType: line.expenseType,
        amount: Number(line.amount),
        description: line.description
      }));

      const dayTotal = formattedLines.reduce((sum, line) => sum + line.amount, 0);

      const payload = {
        clientId: selectedClientId,
        date: expenseDate,
        expenses: formattedLines,
        dayTotal: dayTotal,
        totalExpenses: formattedLines.length
      };

      await axiosInstance.post('/populate/create/expenses', payload);
      Alert.alert('Success', 'Expense claim submitted successfully');
      
      // Reset Form State
      setSelectedClientId('');
      setSelectedClientName('Select Client');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpenseLines([{ expenseType: 'travel', amount: '', description: '' }]);
      setShowCreateModal(false);

      // Refresh list
      fetchExpenses();
    } catch (error: any) {
      console.error('Error creating expense claim:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit expense claim');
    } finally {
      setSubmitting(false);
    }
  };

  const renderExpenseItem = ({ item }: { item: ExpenseRecord }) => {
    const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    const formattedDate = new Date(item.date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const clientName = item.clientId?.name || 'Internal / Direct';
    const total = (item.dayTotal || 0).toLocaleString('en-IN');

    return (
      <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row overflow-hidden">
        {/* Left vertical color accent bar for Payroll system */}
        <View className="w-1.5 bg-[#059669]" />

        <View className="flex-1 p-3">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-1.5">
              <Calendar size={13} color="#8890A8" />
              <Text className="text-xs font-semibold text-[#1A1D2E]">{formattedDate}</Text>
            </View>
            <View style={{ backgroundColor: statusStyle.bg }} className="px-2.5 py-0.5 rounded-full">
              <Text style={{ color: statusStyle.text }} className="text-[10px] font-bold capitalize">
                {item.status}
              </Text>
            </View>
          </View>

          {/* Details Row */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-2">
              <Building size={14} color="#8890A8" />
              <Text className="text-xs text-gray-700 font-semibold" numberOfLines={1}>
                {clientName}
              </Text>
            </View>
            <Text className="text-sm font-bold text-[#059669]">₹{total}</Text>
          </View>

          {/* Breakdown / Items List */}
          <View className="border-t border-gray-50 pt-2 gap-1.5">
            {item.expenses.map((exp, idx) => (
              <View key={exp._id || idx} className="flex-row justify-between items-center">
                <Text className="text-[11px] text-gray-400 font-medium capitalize" numberOfLines={1}>
                  • {exp.expenseType} ({exp.description})
                </Text>
                <Text className="text-[11px] text-gray-600 font-bold">
                  ₹{(exp.amount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F7F8FC]">
      {/* Top Banner / Summary */}
      <View className="bg-white border-b border-gray-100 px-5 py-4 shadow-sm flex-row items-center justify-between">
        <View>
          <Text className="text-xs text-gray-400 font-medium">Claims Submitted</Text>
          <Text className="text-lg font-bold text-[#1A1D2E]">{expenses.length} claims</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          className="bg-[#059669] rounded-xl px-4 py-2.5 flex-row items-center gap-1.5 shadow-sm"
        >
          <Plus size={16} color="#FFF" />
          <Text className="text-white font-bold text-xs">Add Claim</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="mt-2 text-gray-500 text-sm">Loading claims...</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#059669" />
          }
          ListEmptyComponent={
            <View className="py-16 items-center justify-center">
              <View className="bg-emerald-50 p-4 rounded-full mb-3">
                <Plane size={32} color="#059669" />
              </View>
              <Text className="text-gray-800 font-bold text-base mb-1">No Claims Found</Text>
              <Text className="text-gray-400 text-xs text-center max-w-[250px]">
                Submit daily travel, lodging, or food expenses to request reimbursement.
              </Text>
            </View>
          }
        />
      )}

      {/* Add Expenses Bottom Sheet Modal */}
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
              <Text className="text-lg font-bold text-[#1A1D2E]">New Expense Claim</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} className="p-1">
                <X size={20} color="#8890A8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
              {/* Client Selector */}
              <View className="relative z-10 gap-1">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client *</Text>
                <TouchableOpacity
                  onPress={() => setShowClientDropdown(!showClientDropdown)}
                  className="bg-[#F7F8FC] border border-gray-100 rounded-xl px-4 py-3 flex-row justify-between items-center"
                >
                  <Text className="text-sm font-medium text-gray-700">{selectedClientName}</Text>
                  <Plus size={16} color="#8890A8" />
                </TouchableOpacity>

                {showClientDropdown && (
                  <View className="absolute top-[65px] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg max-h-40 overflow-y-auto py-1 z-20">
                    {clients.map((c) => (
                      <TouchableOpacity
                        key={c._id}
                        onPress={() => {
                          setSelectedClientId(c._id);
                          setSelectedClientName(c.name);
                          setShowClientDropdown(false);
                        }}
                        className="px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                      >
                        <Text className="text-sm text-gray-700 font-medium">{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Date Input */}
              <View className="gap-1 mt-3">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date (YYYY-MM-DD) *</Text>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  value={expenseDate}
                  onChangeText={setExpenseDate}
                  className="bg-[#F7F8FC] border border-gray-100 rounded-xl px-4 py-3 text-[#1A1D2E] text-sm"
                  placeholderTextColor="#8890A8"
                />
              </View>

              {/* Expense Lines Section */}
              <View className="mt-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expense Entries</Text>
                  <TouchableOpacity
                    onPress={addExpenseLine}
                    className="flex-row items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg"
                  >
                    <Plus size={12} color="#059669" />
                    <Text className="text-[11px] font-bold text-[#059669]">Add Item</Text>
                  </TouchableOpacity>
                </View>

                {expenseLines.map((line, idx) => (
                  <View key={idx} className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-100/50">
                    <View className="flex-row justify-between items-center mb-2.5">
                      <Text className="text-xs font-bold text-gray-500">Entry #{idx + 1}</Text>
                      {expenseLines.length > 1 && (
                        <TouchableOpacity onPress={() => removeExpenseLine(idx)}>
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Expense Type Selector */}
                    <View className="flex-row justify-between p-1 bg-white rounded-xl border border-gray-100 mb-2">
                      {EXPENSE_TYPES.map((type) => {
                        const isSelected = line.expenseType === type.value;
                        return (
                          <TouchableOpacity
                            key={type.value}
                            onPress={() => updateLineField(idx, 'expenseType', type.value as any)}
                            className={`flex-1 items-center py-2 rounded-lg ${
                              isSelected ? 'bg-[#059669]/10' : 'bg-transparent'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${
                                isSelected ? 'text-[#059669]' : 'text-gray-500'
                              }`}
                            >
                              {type.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Amount Input */}
                    <TextInput
                      placeholder="Amount (₹)"
                      value={line.amount}
                      keyboardType="numeric"
                      onChangeText={(val) => updateLineField(idx, 'amount', val)}
                      className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-[#1A1D2E] text-xs mb-2"
                      placeholderTextColor="#8890A8"
                    />

                    {/* Description Input */}
                    <TextInput
                      placeholder="Description (e.g. Uber ride, hotel bill...)"
                      value={line.description}
                      onChangeText={(val) => updateLineField(idx, 'description', val)}
                      className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-[#1A1D2E] text-xs"
                      placeholderTextColor="#8890A8"
                    />
                  </View>
                ))}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCreateExpense}
                disabled={submitting}
                className="bg-[#059669] rounded-xl py-3.5 items-center justify-center mt-5 mb-4 shadow-sm"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text className="text-white font-bold text-sm">Submit Claim</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
