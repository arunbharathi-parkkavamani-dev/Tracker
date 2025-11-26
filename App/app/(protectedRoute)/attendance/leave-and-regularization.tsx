import React, { useEffect, useState, useContext } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text, Button, ActivityIndicator } from "react-native-paper";
import Toast from "react-native-toast-message";
import axiosInstance from "@/api/axiosInstance";
import { AuthContext } from "@/context/AuthContext";

// NEW imports
import FormRenderer from "@/components/ui/FormRenderer";
import { leaveFormFields, leaveSubmitButton } from "@/constants/Forms/leaveForm.js";

const LeaveAndRegularizationScreen = ({ onClose, onSuccess, onFailed }) => {
  const { user } = useContext(AuthContext);

  const [mode, setMode] = useState<"" | "leave" | "regularization">("");
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Leave live values
  const [formState, setFormState] = useState({});
  const [availableDays, setAvailableDays] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  // =============== WATCH LEAVE TYPE AND FETCH BALANCE ===============
  useEffect(() => {
    if (mode !== "leave") return;
    const type = formState?.leaveTypeId?._id;
    if (!type || !user?.id) return;

    const fetchAvailableDays = async () => {
      try {
        const res = await axiosInstance.get(`/populate/read/employees/${user.id}?filter=${type}`);
        const stats = res?.data?.data?.leaveStatus || [];
        const match = stats.find((l) => l.leaveType === type);
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
    const { fromDate, toDate } = formState;
    if (!fromDate || !toDate) return;

    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (end < start) return setFormState((x) => ({ ...x, totalDays: null }));

    const diff = (end.getTime() - start.getTime()) / 86400000 + 1;
    setFormState((x) => ({ ...x, totalDays: diff }));
  }, [formState.fromDate, formState.toDate, mode]);

  // =================== LEAVE SUBMIT ===================
  const handleLeaveSubmit = async () => {
    const { leaveTypeId, fromDate, toDate, totalDays, reason } = formState;

    if (!leaveTypeId || !fromDate || !toDate || !reason) {
      Toast.show({ type: "error", text1: "Missing fields" });
      return;
    }

    if (availableDays !== null && totalDays > availableDays) {
      Toast.show({ type: "error", text1: "Insufficient balance" });
      return;
    }

    setSubmitting(true);

    const payload = {
      employeeId: userData._id,
      departmentId: leaveTypeId.departmentId,
      leaveTypeId: leaveTypeId.leaveTypeId,
      leaveName: leaveTypeId.name,
      managerId: userData.professionalInfo?.reportingManager,
      startDate: fromDate,
      endDate: toDate,
      totalDays,
      reason,
      status: "Pending",
      statusOrderKey: 0,
    };

    try {
      await axiosInstance.post("/populate/create/leaves", payload);
      Toast.show({ type: "success", text1: "Leave Submitted" });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      onFailed?.(err);
      Toast.show({ type: "error", text1: "Submit failed" });
    } finally {
      setSubmitting(false);
    }
  };

  // =================== RENDER ===================
  if (loadingUser)
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator />
      </View>
    );

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={{ paddingBottom: 24 }}
        className="flex-1 px-4 pt-4"
      >

        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-white">Leave & Regularization</Text>
          <TouchableOpacity
            onPress={mode ? () => setMode("") : onClose}
            className="px-3 py-1 rounded-full bg-slate-800"
          >
            <Text className="text-white text-lg">×</Text>
          </TouchableOpacity>
        </View>

        {/* Initial selection */}
        {!mode && (
          <View className="flex-row justify-center gap-3 mt-6">
            <Button mode="contained" onPress={() => setMode("leave")}>
              Apply for Leave
            </Button>
            <Button mode="contained" buttonColor="#22c55e" onPress={() => setMode("regularization")}>
              Regularization
            </Button>
          </View>
        )}

        {/* LEAVE FORM */}
        {mode === "leave" && userData && (
          <View className="mt-6 bg-white/90 rounded-2xl p-4">
            <FormRenderer
              fields={leaveFormFields(userData).map((f) =>
                f.name === "availableDays" ? { ...f, externalValue: availableDays } : f
              )}
              submitButton={leaveSubmitButton}
              data={formState}
              onChange={(data) => setFormState(data)}
              onSubmit={handleLeaveSubmit}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default LeaveAndRegularizationScreen;
