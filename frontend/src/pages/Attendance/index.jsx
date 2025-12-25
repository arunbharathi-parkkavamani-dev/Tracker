import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider.jsx";
import LeaveAndRegularization from "./Leave&Regularization.jsx";
import FloatingCard from "../../components/Common/FloatingCard.jsx";
import toast, { Toaster } from "react-hot-toast";
import { Clock, Calendar, Plus, CheckCircle, XCircle } from "lucide-react";

const AttendancePage = () => {
  const { user, loading: authLoading } = useAuth();
  
  const [todayRecord, setTodayRecord] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [timeNow, setTimeNow] = useState(new Date());
  const [activeHours, setActiveHours] = useState(0);

  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  useEffect(() => {
    const interval = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateActiveHours = useCallback(() => {
    if (!todayRecord?.checkIn) return 0;
    const checkInTime = new Date(todayRecord.checkIn);
    const endTime = todayRecord.checkOut ? new Date(todayRecord.checkOut) : new Date();
    return Math.max(0, (endTime - checkInTime) / (1000 * 60 * 60));
  }, [todayRecord]);

  useEffect(() => {
    setActiveHours(calculateActiveHours());
  }, [calculateActiveHours, timeNow]);

  const fetchTodayAttendance = useCallback(async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const filter = JSON.stringify({
        employee: user.id,
        date: {
          $gte: `${today}T00:00:00.000Z`,
          $lte: `${today}T23:59:59.999Z`
        }
      });
      const response = await axiosInstance.get(`/populate/read/attendances?filter=${encodeURIComponent(filter)}`);
      const records = response.data?.data || [];
      setTodayRecord(records[0] || null);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setAttendanceLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || authLoading) return;
    fetchTodayAttendance();
  }, [user, authLoading, fetchTodayAttendance]);

  const handleCheckIn = async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.post('/populate/create/attendances', {
        employee: user.id,
        employeeName: user.name,
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date().toISOString(),
        status: 'Present',
        managerId: user.managerId,
        workType: 'fixed',
        location: { latitude: 10.9338987, longitude: 76.9839277 }
      });
      if (response.data.success) {
        await fetchTodayAttendance();
        toast.success('Successfully checked in!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    try {
      const response = await axiosInstance.put(`/populate/update/attendances/${todayRecord._id}`, {
        checkOut: new Date().toISOString(),
        location: { latitude: 10.9338987, longitude: 76.9839277 }
      });
      if (response.data.success) {
        await fetchTodayAttendance();
        toast.success('Successfully checked out!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    }
  };

  if (attendanceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading attendance...</p>
        </div>
      </div>
    );
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Attendance</h1>
          <div className="text-4xl font-light text-blue-600">
            {timeNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-gray-600 mt-1">
            {timeNow.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Main Attendance Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-800">Today's Attendance</h2>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${hasCheckedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {hasCheckedIn ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="font-medium">{hasCheckedIn ? 'Present' : 'Absent'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Check In</div>
              <div className="text-xl font-semibold text-gray-800">
                {hasCheckedIn ? formatTime(todayRecord.checkIn) : '--:--'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Check Out</div>
              <div className="text-xl font-semibold text-gray-800">
                {hasCheckedOut ? formatTime(todayRecord.checkOut) : '--:--'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Active Hours</div>
              <div className="text-xl font-semibold text-blue-600">
                {formatHours(activeHours)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {!hasCheckedIn ? (
              <button 
                onClick={handleCheckIn}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Check In</span>
              </button>
            ) : !hasCheckedOut ? (
              <button 
                onClick={handleCheckOut}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <XCircle className="w-5 h-5" />
                <span>Check Out</span>
              </button>
            ) : (
              <div className="text-green-600 font-medium text-lg flex items-center space-x-2">
                <CheckCircle className="w-6 h-6" />
                <span>Day Complete</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setShowLeaveModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Calendar className="w-5 h-5" />
            <span>Request Leave</span>
          </button>
          
          <button 
            onClick={() => window.location.href = '/attendance/calendar'}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Calendar className="w-5 h-5" />
            <span>View Calendar</span>
          </button>
        </div>

        {/* Leave Modal */}
        {showLeaveModal && (
          <FloatingCard onClose={() => setShowLeaveModal(false)}>
            <LeaveAndRegularization
              onClose={() => setShowLeaveModal(false)}
              onSuccess={() => {
                setShowLeaveModal(false);
                fetchTodayAttendance();
              }}
            />
          </FloatingCard>
        )}
      </div>
      
      <Toaster position="top-right" />
    </div>
  );
};

export default AttendancePage;