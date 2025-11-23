import React, { useEffect, useState, useCallback, useContext } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import {
  Text,
  Button,
  TextInput,
  ActivityIndicator,
  Portal,
  Modal,
  List,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import axiosInstance from "@/api/axiosInstance";
import { AuthContext } from "@/context/AuthContext"; // adjust path to your hook

// ---- Types ----
type LeaveTypeOption = {
  _id: string;
  leaveTypeId: string;
  name: string;
  departmentId: string;
};

type UserData = {
  _id: string;
  basicInfo: {
    firstName: string;
  };
  professionalInfo: {
    department: string;
    reportingManager?: string;
  };
  leaveStatus?: {
    leaveType: string;
    available: number;
  }[];
};

type Props = {
  onClose?: () => void;
  onSuccess?: () => void;
  onFailed?: (msg: any) => void;
};

const LeaveAndRegularizationScreen: React.FC<Props> = ({
  onClose,
  onSuccess,
  onFailed,
}) => {
  const { user } = useContext(AuthContext);
  const [mode, setMode] = useState<"" | "leave" | "regularization">("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ---- Leave form state ----
  const [leaveType, setLeaveType] = useState<LeaveTypeOption | null>(null);
  const [leaveTypeLoading, setLeaveTypeLoading] = useState(false);
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<LeaveTypeOption[]>(
    []
  );

  const [startDate, setStartDate] = useState(""); // e.g. "2025-11-22"
  const [endDate, setEndDate] = useState("");
  const [totalDays, setTotalDays] = useState<number | null>(null);
  const [availableDays, setAvailableDays] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // ---- Regularization state (simple example) ----
  const [regDate, setRegDate] = useState("");
  const [regReason, setRegReason] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);

  // ========================= FETCH USER PROFILE =========================
  useEffect(() => {
    if (!user?.id) return;

    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get(`/populate/read/employees/${user.id}`);
        setUserData(res.data.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        onFailed?.("Failed to load employee profile");
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load employee profile",
        });
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [user?.id]);

  // ========================= LEAVE TYPE OPTIONS (SEARCHABLE DROPDOWN) =========================
  const fetchLeaveTypes = useCallback(async () => {
    if (!userData?._id) return;

    try {
      setLeaveTypeLoading(true);
      const res = await axiosInstance.post(
        `/populate/read/employees/${userData._id}`,
        {
          aggregate: true,
          stages: [
            {
              $lookup: {
                from: "departments",
                localField: "professionalInfo.department",
                foreignField: "_id",
                as: "departmentDetails",
              },
            },
            { $unwind: "$departmentDetails" },
            {
              $lookup: {
                from: "leavepolicies",
                localField: "departmentDetails.leavePolicy",
                foreignField: "_id",
                as: "leavePolicyDetails",
              },
            },
            { $unwind: "$leavePolicyDetails" },
            { $unwind: "$leavePolicyDetails.leaves" },
            {
              $lookup: {
                from: "leavetypes",
                localField: "leavePolicyDetails.leaves.leaveType",
                foreignField: "_id",
                as: "leaveTypeInfo",
              },
            },
            { $unwind: "$leaveTypeInfo" },
            {
              $project: {
                _id: "$leaveTypeInfo._id",
                leaveTypeId: "$leaveTypeInfo._id",
                name: "$leaveTypeInfo.name",
                departmentId: "$departmentDetails._id",
              },
            },
          ],
        }
      );

      const data: LeaveTypeOption[] = res?.data?.data || [];
      setLeaveTypeOptions(data);
    } catch (err) {
      console.error("Failed to fetch leave types", err);
      onFailed?.("Failed to load leave types");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load leave types",
      });
    } finally {
      setLeaveTypeLoading(false);
    }
  }, [userData?._id]);

  // ========================= FETCH AVAILABLE DAYS WHEN LEAVE TYPE CHANGES =========================
  useEffect(() => {
    if (mode !== "leave") return;
    if (!leaveType?._id || !user?.id) return;

    const fetchAvailable = async () => {
      try {
        const res = await axiosInstance.get(
          `/populate/read/employees/${user.id}?filter=${leaveType._id}`
        );
        const stats = res?.data?.data?.leaveStatus || [];
        const match = stats.find((l: any) => l.leaveType === leaveType._id);
        setAvailableDays(match?.available ?? 0);
      } catch (err) {
        console.error("Failed fetching availability", err);
        setAvailableDays(0);
      }
    };

    fetchAvailable();
  }, [leaveType?._id, mode, user?.id]);

  // ========================= AUTO CALCULATE totalDays =========================
  useEffect(() => {
    if (mode !== "leave") return;
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    if (end < start) return;

    const diff =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1; // inclusive
    setTotalDays(diff);
  }, [startDate, endDate, mode]);

  // ========================= LEAVE SUBMIT =========================
  const handleLeaveSubmit = async () => {
    if (!userData || !leaveType || !startDate || !endDate || !reason) {
      Toast.show({
        type: "error",
        text1: "Missing fields",
        text2: "Please fill all required fields",
      });
      return;
    }

    if (totalDays == null || totalDays <= 0) {
      Toast.show({
        type: "error",
        text1: "Invalid dates",
        text2: "Please check From / To dates",
      });
      return;
    }

    if (availableDays != null && totalDays > availableDays) {
      const msg = "Insufficient leave balance";
      onFailed?.(msg);
      Toast.show({
        type: "error",
        text1: "Leave rejected",
        text2: msg,
      });
      return;
    }

    setSubmitting(true);

    const payload = {
      employeeId: userData._id,
      employeeName: userData.basicInfo.firstName,
      departmentId: leaveType.departmentId,
      leaveTypeId: leaveType.leaveTypeId,
      leaveName: leaveType.name,
      managerId: userData.professionalInfo?.reportingManager,
      status: "Pending", // you can map statusId if you have it
      statusOrderKey: 0, // adapt as needed
      startDate,
      endDate,
      totalDays,
      reason,
    };

    try {
      await axiosInstance.post("/populate/create/leaves", payload);
      Toast.show({
        type: "success",
        text1: "Leave submitted",
        text2: "Your request was sent for approval",
      });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Leave submit failed:", err);
      onFailed?.(err);
      Toast.show({
        type: "error",
        text1: "Submit failed",
        text2: "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ========================= REGULARIZATION SUBMIT (SIMPLE EXAMPLE) =========================
  const handleRegularizationSubmit = async () => {
    if (!regDate || !regReason) {
      Toast.show({
        type: "error",
        text1: "Missing fields",
        text2: "Date and Reason are required",
      });
      return;
    }

    setRegSubmitting(true);

    const payload = {
      employeeId: userData?._id,
      date: regDate,
      reason: regReason,
    };

    try {
      await axiosInstance.post("/populate/create/regularization", payload);
      Toast.show({
        type: "success",
        text1: "Regularization submitted",
      });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Regularization submit failed:", err);
      onFailed?.(err);
      Toast.show({
        type: "error",
        text1: "Submit failed",
        text2: "Please try again",
      });
    } finally {
      setRegSubmitting(false);
    }
  };

  // ========================= SEARCHABLE DROPDOWN COMPONENT =========================
  const [leaveTypeModalVisible, setLeaveTypeModalVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filteredLeaveTypes = leaveTypeOptions.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const openLeaveTypeModal = () => {
    setLeaveTypeModalVisible(true);
    if (leaveTypeOptions.length === 0) {
      fetchLeaveTypes();
    }
  };

  const closeLeaveTypeModal = () => {
    setLeaveTypeModalVisible(false);
    setSearch("");
  };

  // ========================= RENDER =========================
  if (loadingUser) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        className="flex-1 px-4 pt-4"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-white">
            Leave & Regularization
          </Text>
          <TouchableOpacity
            onPress={mode ? () => setMode("") : onClose}
            className="px-3 py-1 rounded-full bg-slate-800"
          >
            <Text className="text-white text-lg">×</Text>
          </TouchableOpacity>
        </View>

        {/* Mode selection */}
        {!mode && (
          <View className="flex-row justify-center gap-3 mt-6">
            <Button
              mode="contained"
              onPress={() => setMode("leave")}
              style={{ borderRadius: 999 }}
            >
              Apply for Leave
            </Button>
            <Button
              mode="contained"
              buttonColor="#22c55e"
              onPress={() => setMode("regularization")}
              style={{ borderRadius: 999 }}
            >
              Regularization
            </Button>
          </View>
        )}

        {/* LEAVE FORM */}
        {mode === "leave" && userData && (
          <View className="mt-6 bg-white/90 rounded-2xl p-4">
            <Text className="text-base font-semibold mb-3">
              Leave Application
            </Text>

            {/* Leave Type - searchable dropdown */}
            <Text className="mb-1 text-xs text-gray-600">Leave Type</Text>
            <TouchableOpacity onPress={openLeaveTypeModal}>
              <TextInput
                mode="outlined"
                editable={false}
                value={leaveType?.name || ""}
                placeholder="Select Leave Type"
                right={
                  <TextInput.Icon
                    icon={leaveTypeLoading ? "refresh" : "menu-down"}
                  />
                }
              />
            </TouchableOpacity>

            {/* Modal for leave type selection */}
            <Portal>
              <Modal
                visible={leaveTypeModalVisible}
                onDismiss={closeLeaveTypeModal}
                contentContainerStyle={{
                  margin: 16,
                  backgroundColor: "white",
                  borderRadius: 16,
                  maxHeight: "80%",
                }}
              >
                <View className="p-3">
                  <Text className="text-base font-semibold mb-2">
                    Select Leave Type
                  </Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Search..."
                    value={search}
                    onChangeText={setSearch}
                  />
                  <View className="mt-2">
                    {leaveTypeLoading ? (
                      <ActivityIndicator />
                    ) : filteredLeaveTypes.length === 0 ? (
                      <Text className="text-sm text-gray-500 mt-2">
                        No leave types found
                      </Text>
                    ) : (
                      filteredLeaveTypes.map((opt) => (
                        <List.Item
                          key={opt._id}
                          title={opt.name}
                          onPress={() => {
                            setLeaveType(opt);
                            closeLeaveTypeModal();
                          }}
                        />
                      ))
                    )}
                  </View>
                </View>
              </Modal>
            </Portal>

            {/* From Date */}
            <Text className="mt-4 mb-1 text-xs text-gray-600">From Date</Text>
            <TextInput
              mode="outlined"
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
            />

            {/* To Date */}
            <Text className="mt-4 mb-1 text-xs text-gray-600">To Date</Text>
            <TextInput
              mode="outlined"
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
            />

            {/* Available Days (read-only) */}
            <Text className="mt-4 mb-1 text-xs text-gray-600">
              Available Days
            </Text>
            <View className="px-3 py-2 rounded bg-slate-100">
              <Text className="text-sm font-semibold">
                {availableDays ?? "—"}
              </Text>
            </View>

            {/* Total Days (read-only) */}
            <Text className="mt-4 mb-1 text-xs text-gray-600">Total Days</Text>
            <View className="px-3 py-2 rounded bg-slate-100">
              <Text className="text-sm font-semibold">
                {totalDays ?? "—"}
              </Text>
            </View>

            {/* Reason */}
            <Text className="mt-4 mb-1 text-xs text-gray-600">Reason</Text>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
              placeholder="Enter reason for leave"
            />

            <Button
              mode="contained"
              onPress={handleLeaveSubmit}
              loading={submitting}
              disabled={submitting}
              style={{ marginTop: 16 }}
            >
              Submit Leave Request
            </Button>
          </View>
        )}

        {/* REGULARIZATION FORM (simple) */}
        {mode === "regularization" && (
          <View className="mt-6 bg-white/90 rounded-2xl p-4">
            <Text className="text-base font-semibold mb-3">
              Regularization Request
            </Text>

            <Text className="mb-1 text-xs text-gray-600">Date</Text>
            <TextInput
              mode="outlined"
              placeholder="YYYY-MM-DD"
              value={regDate}
              onChangeText={setRegDate}
            />

            <Text className="mt-4 mb-1 text-xs text-gray-600">Reason</Text>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              value={regReason}
              onChangeText={setRegReason}
              placeholder="Enter reason"
            />

            <Button
              mode="contained"
              buttonColor="#22c55e"
              onPress={handleRegularizationSubmit}
              loading={regSubmitting}
              disabled={regSubmitting}
              style={{ marginTop: 16 }}
            >
              Submit Regularization
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default LeaveAndRegularizationScreen;
