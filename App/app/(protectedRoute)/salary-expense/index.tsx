import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Alert
} from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import axiosInstance from '@/api/axiosInstance';
import {
  DollarSign,
  Download,
  Calendar,
  X,
  FileText,
  User,
  Info
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PayrollRecord {
  _id: string;
  month: number;
  year: number;
  grossSalary: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  lopDays: number;
  status: 'Draft' | 'Processing' | 'Processed' | 'Approved' | 'Paid';
  overtimePay?: number;
  earnedBreakdown?: Record<string, number>;
  deductionBreakdown?: Record<string, number>;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_CHIPS = {
  Draft: { bg: '#F3F4F6', text: '#4B5563' },
  Processing: { bg: '#FEF3C7', text: '#D97706' },
  Processed: { bg: '#DBEAFE', text: '#2563EB' },
  Approved: { bg: '#D1FAE5', text: '#059669' },
  Paid: { bg: '#D1FAE5', text: '#059669' },
};

export default function SalaryExpenses() {
  const { user } = useContext(AuthContext);
  const thisYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(thisYear);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  const fetchPayslips = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await axiosInstance.post('/populate/read/payrolls', {
        filter: { employeeId: user.id, year: selectedYear },
        sort: { month: -1 },
        limit: 12
      });
      setPayrolls(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching payslips:', error);
      Alert.alert('Error', 'Failed to fetch payroll records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, selectedYear]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayslips();
  };

  const handleDownloadPdf = (rec: PayrollRecord) => {
    Alert.alert(
      'Download Started',
      `Mock PDF for ${MONTHS[rec.month - 1]} ${rec.year} has been downloaded to your device.`
    );
  };

  const years = Array.from({ length: 4 }, (_, i) => thisYear - i);

  const renderPayrollItem = ({ item }: { item: PayrollRecord }) => {
    const statusStyle = STATUS_CHIPS[item.status] || STATUS_CHIPS.Draft;
    const gross = (item.grossSalary || 0).toLocaleString('en-IN');
    const net = (item.netSalary || 0).toLocaleString('en-IN');
    const monthName = MONTHS[(item.month || 1) - 1];

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setSelectedRecord(item)}
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row overflow-hidden"
      >
        {/* Left vertical color accent bar for Payroll system */}
        <View className="w-1.5 bg-[#059669]" />

        <View className="flex-1 p-3">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-bold text-[#1A1D2E]">
              {monthName} {item.year}
            </Text>
            <View style={{ backgroundColor: statusStyle.bg }} className="px-2.5 py-0.5 rounded-full">
              <Text style={{ color: statusStyle.text }} className="text-[10px] font-bold">
                {item.status}
              </Text>
            </View>
          </View>

          {/* Quick numbers band */}
          <View className="flex-row justify-between items-center bg-gray-50 rounded-xl p-3 mb-2">
            <View>
              <Text className="text-[9px] font-semibold text-[#8890A8] uppercase tracking-wider">Gross Salary</Text>
              <Text className="text-xs font-semibold text-gray-700">₹{gross}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[9px] font-semibold text-[#8890A8] uppercase tracking-wider">Net Take-Home</Text>
              <Text className="text-sm font-bold text-[#059669]">₹{net}</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center pt-1">
            <Text className="text-xs text-[#8890A8]">
              Present: {item.presentDays}/{item.workingDays} days
            </Text>
            {item.lopDays > 0 ? (
              <Text className="text-xs font-bold text-red-500">
                LOP: {item.lopDays} Days
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#F7F8FC]">
      {/* Year Filter Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between shadow-sm">
        <Text className="text-sm font-semibold text-[#1A1D2E]">Select Fiscal Year</Text>
        <View className="flex-row gap-1">
          {years.map((y) => (
            <TouchableOpacity
              key={y}
              onPress={() => setSelectedYear(y)}
              className={`px-3 py-1.5 rounded-lg border ${
                selectedYear === y
                  ? 'bg-[#059669] border-[#059669]'
                  : 'bg-white border-gray-100'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedYear === y ? 'text-white' : 'text-gray-600'
                }`}
              >
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="mt-2 text-gray-500 text-sm">Loading payslips...</Text>
        </View>
      ) : (
        <FlatList
          data={payrolls}
          renderItem={renderPayrollItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, py: 12, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#059669" />
          }
          ListEmptyComponent={
            <View className="py-16 items-center justify-center">
              <View className="bg-emerald-50 p-4 rounded-full mb-3">
                <DollarSign size={32} color="#059669" />
              </View>
              <Text className="text-gray-800 font-bold text-base mb-1">No Payslips Found</Text>
              <Text className="text-gray-400 text-xs text-center max-w-[250px]">
                There are no payroll records generated for the year {selectedYear}.
              </Text>
            </View>
          }
        />
      )}

      {/* Payslip Details Modal */}
      <Modal
        visible={selectedRecord !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedRecord(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[28px] max-h-[85%]">
            {selectedRecord && (() => {
              const statusStyle = STATUS_CHIPS[selectedRecord.status] || STATUS_CHIPS.Draft;
              const earned = selectedRecord.earnedBreakdown || {};
              const deducted = selectedRecord.deductionBreakdown || {};
              const earnedEntries = Object.entries(earned);
              const deductedEntries = Object.entries(deducted);

              return (
                <View className="flex-col h-full">
                  {/* Gradient Header */}
                  <LinearGradient
                    colors={['#059669', '#34D399']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
                  >
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-xs font-bold text-emerald-100 uppercase tracking-widest">
                        Payslip breakdown
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <View style={{ backgroundColor: '#white' }} className="bg-white/20 px-2.5 py-0.5 rounded-full">
                          <Text style={{ color: '#fff' }} className="text-[10px] font-bold">
                            {selectedRecord.status}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedRecord(null)} className="p-1">
                          <X size={20} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text className="text-lg font-bold text-white">
                      {MONTHS[selectedRecord.month - 1]} {selectedRecord.year} Payslip
                    </Text>
                    <Text className="text-2xl font-bold text-white mt-1">
                      ₹{(selectedRecord.netSalary || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text className="text-xs text-emerald-100">Net take-home pay</Text>
                  </LinearGradient>

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} className="space-y-4">
                    {/* Earnings Breakdown */}
                    <View className="mb-4">
                      <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Earnings</Text>
                      <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        {earnedEntries.length > 0 ? (
                          earnedEntries.map(([name, val]) => (
                            <View key={name} className="flex-row justify-between items-center py-2 border-b border-gray-100/50 last:border-b-0">
                              <Text className="text-xs font-medium text-gray-700">{name}</Text>
                              <Text className="text-xs font-bold text-emerald-600">₹{(val || 0).toLocaleString('en-IN')}</Text>
                            </View>
                          ))
                        ) : (
                          <View className="flex-row justify-between items-center py-1">
                            <Text className="text-xs text-gray-500">Gross Salary (Flat)</Text>
                            <Text className="text-xs font-bold text-emerald-600">₹{(selectedRecord.grossSalary || 0).toLocaleString('en-IN')}</Text>
                          </View>
                        )}
                        {selectedRecord.overtimePay ? (
                          <View className="flex-row justify-between items-center py-2 border-t border-gray-100/50">
                            <Text className="text-xs font-medium text-gray-700">Overtime</Text>
                            <Text className="text-xs font-bold text-emerald-600">₹{(selectedRecord.overtimePay || 0).toLocaleString('en-IN')}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Deductions Breakdown */}
                    {deductedEntries.length > 0 ? (
                      <View className="mb-4">
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Deductions</Text>
                        <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          {deductedEntries.map(([name, val]) => val > 0 ? (
                            <View key={name} className="flex-row justify-between items-center py-2 border-b border-gray-100/50 last:border-b-0">
                              <Text className="text-xs font-medium text-gray-700">{name}</Text>
                              <Text className="text-xs font-bold text-red-500">- ₹{(val || 0).toLocaleString('en-IN')}</Text>
                            </View>
                          ) : null)}
                        </View>
                      </View>
                    ) : null}

                    {/* Summary Row */}
                    <View className="border-t border-gray-100 pt-4 gap-2 mb-4">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-xs text-gray-500">Gross Salary</Text>
                        <Text className="text-xs font-semibold text-gray-800">₹{(selectedRecord.grossSalary || 0).toLocaleString('en-IN')}</Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-xs text-gray-500">Deductions</Text>
                        <Text className="text-xs font-semibold text-red-500">
                          - ₹{((selectedRecord.grossSalary - selectedRecord.netSalary) || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center pt-2 border-t border-gray-50">
                        <Text className="text-sm font-bold text-[#1A1D2E]">Net Salary Paid</Text>
                        <Text className="text-base font-bold text-[#059669]">₹{(selectedRecord.netSalary || 0).toLocaleString('en-IN')}</Text>
                      </View>
                    </View>

                    {/* Download Button */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleDownloadPdf(selectedRecord)}
                      className="bg-[#059669] rounded-xl py-3.5 flex-row items-center justify-center gap-2 shadow-sm"
                    >
                      <Download size={16} color="#FFF" />
                      <Text className="text-white font-bold text-sm">Download PDF Payslip</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}
