import React, { useEffect, useState, useContext } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import Toast from "react-native-toast-message";
import axiosInstance from "@/api/axiosInstance";
import { AuthContext } from "@/context/AuthContext";
import { router } from "expo-router";
import FormRenderer from "@/components/ui/FormRenderer";
import { leaveFormFields, leaveSubmitButton } from "@/constants/Forms/leaveForm";
import { regularizationFormFields, regularizationSubmitButton } from "@/constants/Forms/regularizationForm";
import { Calendar, Clock, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LeaveAndRegularizationScreen = ({ onClose, onSuccess, onFailed }: {
  onClose?: () => void,
  onSuccess?: () => void,
  onFailed?: (err: any) => void
}) => {
  const { user } = useContext(AuthContext);

  const [mode, setMode] = useState<"" | "leave" | "regularization">("");
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

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
      const startDate = new Date();
      startDate.setDate(now.getDate() - 7);
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const effectiveStartDate = startDate < startOfCurrentMonth ? startOfCurrentMonth : startDate;
      const res = await axiosInstance.get('/populate/read/attendances', {
        params: {
          filter: JSON.stringify({
            employee: user.id,
            date: {
              $gte: effectiveStartDate.toISOString().split('T')[0],
              $lte: now.toISOString().split('T')[0]
            }
          })
        }
      });
      const issues = res.data.data?.filter((record: any) =>
        !record.checkIn || !record.checkOut || record.status === 'Absent' || record.status === 'Half Day'
      ) || [];
      setAttendanceIssues(issues);
    } catch (error) {
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
        await axiosInstance.post("/populate/create/leaves", {
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
        });
        Toast.show({ type: "success", text1: "Leave Application Submitted" });
      } else if (mode === "regularization") {
        if (!selectedIssue) {
          Toast.show({ type: "error", text1: "Please select a date first" });
          setSubmitting(false);
          return;
        }
        const combineDateAndTime = (dateStr: string, timeStr: string) => {
          if (!timeStr) return null;
          if (timeStr.includes('T')) return timeStr;
          try {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const date = new Date(dateStr);
            date.setHours(hours, minutes, 0, 0);
            return date.toISOString();
          } catch {
            return timeStr;
          }
        };
        await axiosInstance.post("/populate/create/regularizations", {
          attendanceId: selectedIssue._id,
          employeeId: (userData as any)._id,
          employeeName: `${(userData as any).basicInfo?.firstName || ''} ${(userData as any).basicInfo?.lastName || ''}`.trim(),
          departmentId: (userData as any).professionalInfo?.department,
          managerId: (userData as any).professionalInfo?.reportingManager,
          requestDate: data.requestDate,
          originalCheckIn: selectedIssue.checkIn,
          originalCheckOut: selectedIssue.checkOut,
          requestedCheckIn: combineDateAndTime(data.requestDate, data.requestedCheckIn),
          requestedCheckOut: combineDateAndTime(data.requestDate, data.requestedCheckOut),
          reason: data.reason,
          status: "Pending",
          createdBy: (userData as any)._id
        });
        Toast.show({ type: "success", text1: "Regularization Submitted" });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/(protectedRoute)/attendance" as any);
      }
      if (onClose) onClose();
      else if (onSuccess) {
        setMode("");
        setShowDateSelection(false);
        setSelectedIssue(null);
      }
    } catch (err) {
      if (onFailed) onFailed(err);
      else Toast.show({ type: "error", text1: "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetMode = () => {
    setMode("");
    setShowDateSelection(false);
    setSelectedIssue(null);
  };

  // =================== RENDER ===================
  if (loadingUser) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FC' }}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FC' }} edges={['bottom', 'left', 'right']}>
      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>

          {/* ── Breadcrumb / Back control ── */}
          {mode !== "" && (
            <TouchableOpacity
              onPress={resetMode}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}
              activeOpacity={0.7}
            >
              <ChevronLeft size={16} color="#7C3AED" />
              <Text style={{ color: '#7C3AED', fontSize: 13, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
          )}

          {/* ── Page title ── */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#B4BACC', letterSpacing: 0.5, marginBottom: 4 }}>ATTENDANCE</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1D2E', marginBottom: 16 }}>
            {!mode
              ? 'Leave & Regularization'
              : mode === 'leave'
                ? 'Leave Application'
                : selectedIssue
                  ? `Regularize · ${new Date(selectedIssue.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                  : 'Regularization'}
          </Text>

          {/* ══════ INITIAL SELECTION ══════ */}
          {!mode && (
            <View style={{ gap: 10 }}>
              {/* Leave card */}
              <TouchableOpacity
                onPress={() => setMode("leave")}
                activeOpacity={0.75}
                style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Calendar size={20} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1D2E' }}>Apply for Leave</Text>
                  <Text style={{ fontSize: 12, color: '#8890A8', marginTop: 2 }}>Vacation, sick days, or personal time</Text>
                </View>
                <ChevronRight size={16} color="#B4BACC" />
              </TouchableOpacity>

              {/* Regularization card */}
              <TouchableOpacity
                onPress={handleRegularizationClick}
                activeOpacity={0.75}
                style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Clock size={20} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1D2E' }}>Regularization</Text>
                  <Text style={{ fontSize: 12, color: '#8890A8', marginTop: 2 }}>Correct missing check-ins or check-outs</Text>
                </View>
                <ChevronRight size={16} color="#B4BACC" />
              </TouchableOpacity>
            </View>
          )}

          {/* ══════ DATE SELECTION (REGULARIZATION) ══════ */}
          {mode === "regularization" && showDateSelection && (
            <View>
              {fetchingIssues ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <ActivityIndicator color="#10B981" />
                  <Text style={{ color: '#8890A8', marginTop: 12, fontSize: 13 }}>Checking attendance records…</Text>
                </View>
              ) : attendanceIssues.length === 0 ? (
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 28, alignItems: 'center' }}>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <CheckCircle size={24} color="#10B981" />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1D2E', marginBottom: 6 }}>All Clear!</Text>
                  <Text style={{ fontSize: 13, color: '#8890A8', textAlign: 'center' }}>
                    No attendance issues found in the last 30 days.
                  </Text>
                  <TouchableOpacity
                    onPress={resetMode}
                    style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#EDE9FE', borderRadius: 10 }}
                  >
                    <Text style={{ color: '#7C3AED', fontWeight: '600', fontSize: 13 }}>Go Back</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={{ fontSize: 12, color: '#8890A8', marginBottom: 10 }}>
                    Found {attendanceIssues.length} issue{attendanceIssues.length > 1 ? 's' : ''} — select a record to correct
                  </Text>
                  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' }}>
                    {attendanceIssues.map((record: any, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleIssueSelect(record)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row', alignItems: 'center', padding: 14,
                          borderBottomWidth: idx < attendanceIssues.length - 1 ? 1 : 0,
                          borderBottomColor: '#F1F5F9'
                        }}
                      >
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <AlertTriangle size={16} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1D2E' }}>
                            {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>
                            {!record.checkIn ? 'Missing check-in' : !record.checkOut ? 'Missing check-out' : record.status}
                          </Text>
                        </View>
                        <ChevronRight size={14} color="#B4BACC" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ══════ FORMS ══════ */}
          {mode && !showDateSelection && (
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 }}>
              {submitting ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <ActivityIndicator color="#7C3AED" />
                  <Text style={{ color: '#8890A8', marginTop: 12, fontSize: 13 }}>Submitting request…</Text>
                </View>
              ) : (
                <FormRenderer
                  fields={mode === "leave"
                    ? leaveFormFields(userData!).map((f: any) =>
                        f.name === "availableDays" ? { ...f, externalValue: availableDays } : f
                      )
                    : regularizationFormFields
                  }
                  submitButton={mode === "leave" ? leaveSubmitButton : regularizationSubmitButton}
                  data={formState}
                  onChange={(data: any) => setFormState(data)}
                  onSubmit={handleSubmit}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LeaveAndRegularizationScreen;
