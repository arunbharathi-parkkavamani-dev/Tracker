import React, { useEffect, useState, useContext } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text, Button, ActivityIndicator } from "react-native-paper";
import Toast from "react-native-toast-message";
import axiosInstance from "@/api/axiosInstance";
import { AuthContext } from "@/context/AuthContext";
import { router } from "expo-router";

// NEW imports
import FormRenderer from "@/components/ui/FormRenderer";
import { leaveFormFields, leaveSubmitButton } from "@/constants/Forms/leaveForm";
import { regularizationFormFields, regularizationSubmitButton } from "@/constants/Forms/regularizationForm";

const LeaveAndRegularizationScreen = ({ onClose, onSuccess, onFailed }: {
  onClose: () => void,
  onSuccess: () => void,
  onFailed: (err: any) => void
}) => {
  const { user } = useContext(AuthContext);

  const [mode, setMode] = useState<"" | "leave" | "regularization">("");
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Leave / Regularization live values
  const [formState, setFormState] = useState<any>({});
  const [availableDays, setAvailableDays] = useState<number | null>(null);
  const [attendanceIssues, setAttendanceIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingIssues, setFetchingIssues] = useState(false);

  // =================== FETCH USER PROFILE ===================
  useEffect(() => {
    if (!user?.id) return;
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get(`/populate/read/employees/${user.id}`);
        setUserData(res.data.data);
      } catch {
        onFailed?.("Failed to load profile");
        Toast.show({ type: "error", text1: "Error", text2: "Failed to load profile" });
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [user?.id]);

  // =============== FETCH ATTENDANCE ISSUES ===============
  const fetchAttendanceIssues = async () => {
    setFetchingIssues(true);
    try {
      const now = new Date();
      const endDate = now;
      const startDate = new Date();
      startDate.setDate(now.getDate() - 7); // Last 7 days

      // Ensure we don't go back to the previous month
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const effectiveStartDate = startDate < startOfCurrentMonth ? startOfCurrentMonth : startDate;

      const res = await axiosInstance.get('/populate/read/attendances', {
        params: {
          filter: JSON.stringify({
            employee: user.id,
            date: {
              $gte: effectiveStartDate.toISOString().split('T')[0],
              $lte: endDate.toISOString().split('T')[0]
            }
          })
        }
      });

      const issues = res.data.data?.filter((record: any) => {
        const hasIssue = !record.checkIn || !record.checkOut ||
          record.status === 'Absent' || record.status === 'Half Day';
        return hasIssue;
      }) || [];

      setAttendanceIssues(issues);
    } catch (error) {
      console.error('Error fetching attendance issues:', error);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to load attendance issues" });
    } finally {
      setFetchingIssues(false);
    }
  };

  const handleRegularizationClick = () => {
    setMode("regularization");
    setShowDateSelection(true);
    fetchAttendanceIssues();
  };

  const handleIssueSelect = (record: any) => {
    setSelectedIssue(record);
    setFormState({
      requestDate: record.date,
      requestedCheckIn: record.checkIn || "09:00",
      requestedCheckOut: record.checkOut || "18:00",
      reason: "",
    });
    setShowDateSelection(false);
  };

  // =============== WATCH LEAVE TYPE AND FETCH BALANCE ===============
  useEffect(() => {
    if (mode !== "leave") return;
    const type = formState?.leaveTypeId?._id;
    if (!type || !user?.id) return;

    const fetchAvailableDays = async () => {
      try {
        const res = await axiosInstance.get(`/populate/read/employees/${user.id}?filter=${type}`);
        const stats = res?.data?.data?.leaveStatus || [];
        const match = stats.find((l: any) => l.leaveType === type);
        setAvailableDays(match?.available ?? 0);
      } catch {
        setAvailableDays(0);
      }
    };
    fetchAvailableDays();
  }, [formState?.leaveTypeId?._id, mode]);

  // =============== AUTO CALCULATE TOTAL DAYS ===============
  useEffect(() => {
    if (mode !== "leave") return;
    const { startDate, endDate } = formState;
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return setFormState((x: any) => ({ ...x, totalDays: null }));

    const diff = (end.getTime() - start.getTime()) / 86400000 + 1;
    setFormState((x: any) => ({ ...x, totalDays: diff }));
  }, [formState.startDate, formState.endDate, mode]);

  // =================== FINAL SUBMIT ===================
  const handleSubmit = async (data: any) => {
    if (!userData) return;
    setSubmitting(true);

    try {
      if (mode === "leave") {
        if (availableDays !== null && (formState.totalDays || 0) > availableDays) {
          Toast.show({ type: "error", text1: "Insufficient balance" });
          setSubmitting(false);
          return;
        }

        const payload = {
          employeeId: (userData as any)._id,
          employeeName: (userData as any).basicInfo.firstName,
          departmentId: data.leaveTypeId.departmentId,
          leaveTypeId: data.leaveTypeId.leaveTypeId,
          leaveName: data.leaveTypeId.name,
          managerId: (userData as any).professionalInfo?.reportingManager,
          startDate: data.startDate,
          endDate: data.endDate,
          totalDays: formState.totalDays,
          reason: data.reason,
          status: "Pending",
          statusOrderKey: 0,
        };

        await axiosInstance.post("/populate/create/leaves", payload);
        Toast.show({ type: "success", text1: "Leave Application Submitted" });
      } else if (mode === "regularization") {
        if (!selectedIssue) {
          Toast.show({ type: "error", text1: "Please select a date first" });
          setSubmitting(false);
          return;
        }

        // Convert time strings (HH:mm) to full ISO dates based on the request date
        const combineDateAndTime = (dateStr: string, timeStr: string) => {
          if (!timeStr) return null;
          // If it's already an ISO string, return it
          if (timeStr.includes('T')) return timeStr;

          try {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const date = new Date(dateStr);
            date.setHours(hours, minutes, 0, 0);
            return date.toISOString();
          } catch (e) {
            console.error("Error combining date and time:", e);
            return timeStr;
          }
        };

        const payload = {
          attendanceId: selectedIssue._id,
          employeeId: userData._id,
          employeeName: `${userData.basicInfo?.firstName || ''} ${userData.basicInfo?.lastName || ''}`.trim(),
          departmentId: userData.professionalInfo?.department,
          managerId: userData.professionalInfo?.reportingManager,
          requestDate: data.requestDate,
          originalCheckIn: selectedIssue.checkIn,
          originalCheckOut: selectedIssue.checkOut,
          requestedCheckIn: combineDateAndTime(data.requestDate, data.requestedCheckIn),
          requestedCheckOut: combineDateAndTime(data.requestDate, data.requestedCheckOut),
          reason: data.reason,
          status: "Pending",
          createdBy: userData._id
        };

        await axiosInstance.post("/populate/create/regularizations", payload);
        Toast.show({ type: "success", text1: "Regularization Submitted" });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        Toast.show({ type: "success", text1: "Request Submitted" });
        router.push("/(protectedRoute)/attendance" as any);
      }

      if (onClose) {
        onClose();
      } else if (!onSuccess) {
        // Already handled by router.back()
      } else {
        setMode("");
        setShowDateSelection(false);
        setSelectedIssue(null);
      }
    } catch (err) {
      if (onFailed) {
        onFailed(err);
      } else {
        console.error("Submission error:", err);
        Toast.show({ type: "error", text1: "Submission failed" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // =================== RENDER ===================
  if (loadingUser) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1 px-4 pt-4"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              {!mode ? "Leave & Regularization" : mode === "leave" ? "Leave Application" : "Regularization"}
            </Text>
            {mode === "regularization" && selectedIssue && (
              <Text className="text-blue-600 font-medium">
                For {new Date(selectedIssue.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={mode ? () => { setMode(""); setShowDateSelection(false); setSelectedIssue(null); } : onClose}
            className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
          >
            <Text className="text-gray-600 text-xl">×</Text>
          </TouchableOpacity>
        </View>

        {/* INITIAL SELECTION */}
        {!mode && (
          <View className="gap-4 mt-4">
            <TouchableOpacity
              onPress={() => setMode("leave")}
              className="bg-white border border-blue-100 p-6 rounded-3xl shadow-sm"
            >
              <View className="w-12 h-12 bg-blue-500 rounded-2xl items-center justify-center mb-4">
                <Text className="text-white text-xl">📅</Text>
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-1">Apply for Leave</Text>
              <Text className="text-gray-500 text-sm">Submit a request for vacation, sick days, or personal time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRegularizationClick}
              className="bg-white border border-green-100 p-6 rounded-3xl shadow-sm"
            >
              <View className="w-12 h-12 bg-green-500 rounded-2xl items-center justify-center mb-4">
                <Text className="text-white text-xl">🕒</Text>
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-1">Regularization</Text>
              <Text className="text-gray-500 text-sm">Correct missing check-ins or check-outs in your records</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DATE SELECTION (REGULARIZATION) */}
        {mode === "regularization" && showDateSelection && (
          <View>
            {fetchingIssues ? (
              <View className="py-12 items-center">
                <ActivityIndicator color="#22c55e" />
                <Text className="text-gray-500 mt-4">Checking attendance issues...</Text>
              </View>
            ) : attendanceIssues.length === 0 ? (
              <View className="bg-white rounded-3xl p-8 items-center border border-gray-200">
                <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
                  <Text className="text-green-500 text-2xl">✅</Text>
                </View>
                <Text className="text-lg font-bold text-gray-900 mb-2">All Clear!</Text>
                <Text className="text-gray-500 text-center">Your attendance records for the last 30 days are complete.</Text>
                <Button mode="text" textColor="#3b82f6" onPress={() => setMode("")} className="mt-4">
                  Go Back
                </Button>
              </View>
            ) : (
              <View className="gap-3">
                <Text className="text-gray-500 mb-2">Found {attendanceIssues.length} issues in the last 30 days:</Text>
                {attendanceIssues.map((record: any, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleIssueSelect(record)}
                    className="bg-white border border-gray-200 p-4 rounded-2xl flex-row justify-between items-center shadow-sm"
                  >
                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold">
                        {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </Text>
                      <Text className="text-red-500 text-xs mt-1">
                        {!record.checkIn ? "Missing Check-in" : !record.checkOut ? "Missing Check-out" : record.status}
                      </Text>
                    </View>
                    <Text className="text-gray-400">›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* FORMS */}
        {mode && !showDateSelection && (
          <View className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
            {submitting ? (
              <View className="py-12 items-center">
                <ActivityIndicator color="#3b82f6" />
                <Text className="text-gray-500 mt-4">Submitting request...</Text>
              </View>
            ) : (
              <FormRenderer
                fields={mode === "leave"
                  ? leaveFormFields(userData!).map(f => f.name === "availableDays" ? { ...f, externalValue: availableDays } : f)
                  : regularizationFormFields
                }
                submitButton={mode === "leave" ? leaveSubmitButton : regularizationSubmitButton}
                data={formState}
                onChange={(data) => setFormState(data)}
                onSubmit={handleSubmit}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default LeaveAndRegularizationScreen;
