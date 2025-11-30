import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface Employee {
  _id: string;
  basicInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  professionalInfo: {
    employeeId: string;
    role: string;
    department: string;
    joiningDate: string;
    workType: string;
    reportingManager: string;
  };
  authInfo: {
    workEmail: string;
  };
}

export default function Profile() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const response = await axiosInstance.get(
        `/populate/read/employees/${userId}?populateFields={"professionalInfo.reportingManager":"basicInfo.firstName,basicInfo.lastName"}`
      );
      
      setEmployee(response.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['token', 'userId']);
            router.replace('/(authRoute)/Login');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  if (!employee) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <MaterialIcons name="error" size={64} color="#EF4444" />
        <Text className="text-gray-500 text-lg mt-4">Failed to load profile</Text>
      </View>
    );
  }

  const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
      <Text className="text-lg font-semibold text-gray-900 mb-3">{title}</Text>
      {children}
    </View>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
      <Text className="text-gray-600 flex-1">{label}</Text>
      <Text className="text-gray-900 font-medium flex-2 text-right">{value || 'N/A'}</Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-4 py-8">
        <View className="items-center">
          <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4">
            <Text className="text-2xl font-bold text-blue-600">
              {employee.basicInfo.firstName?.charAt(0)}{employee.basicInfo.lastName?.charAt(0)}
            </Text>
          </View>
          <Text className="text-white text-xl font-bold">
            {employee.basicInfo.firstName} {employee.basicInfo.lastName}
          </Text>
          <Text className="text-blue-100 text-sm mt-1">
            {employee.professionalInfo.role}
          </Text>
        </View>
      </View>

      <View className="px-4 py-4">
        {/* Basic Information */}
        <InfoCard title="Basic Information">
          <InfoRow label="Employee ID" value={employee.professionalInfo.employeeId} />
          <InfoRow label="Email" value={employee.basicInfo.email} />
          <InfoRow label="Work Email" value={employee.authInfo.workEmail} />
          <InfoRow label="Phone" value={employee.basicInfo.phone} />
          <InfoRow label="Date of Birth" value={employee.basicInfo.dateOfBirth ? new Date(employee.basicInfo.dateOfBirth).toLocaleDateString() : ''} />
          <InfoRow label="Gender" value={employee.basicInfo.gender} />
        </InfoCard>

        {/* Address */}
        <InfoCard title="Address">
          <InfoRow label="Street" value={employee.basicInfo.address?.street} />
          <InfoRow label="City" value={employee.basicInfo.address?.city} />
          <InfoRow label="State" value={employee.basicInfo.address?.state} />
          <InfoRow label="ZIP Code" value={employee.basicInfo.address?.zip} />
        </InfoCard>

        {/* Professional Information */}
        <InfoCard title="Professional Information">
          <InfoRow label="Department" value={employee.professionalInfo.department} />
          <InfoRow label="Work Type" value={employee.professionalInfo.workType} />
          <InfoRow label="Joining Date" value={employee.professionalInfo.joiningDate ? new Date(employee.professionalInfo.joiningDate).toLocaleDateString() : ''} />
          <InfoRow label="Reporting Manager" value={employee.professionalInfo.reportingManager || 'N/A'} />
        </InfoCard>

        {/* Actions */}
        <View className="mt-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500 rounded-lg p-4 flex-row items-center justify-center"
          >
            <MaterialIcons name="logout" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}