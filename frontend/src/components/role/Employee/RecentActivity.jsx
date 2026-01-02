import { useState, useEffect } from 'react';
import { Clock, User, FileText, Calendar, CheckSquare } from 'lucide-react';
import axiosInstance from '../../../api/axiosInstance';
import { useAuth } from '../../../context/authProvider';
import ProfileImage from '../../Common/ProfileImage';

const RecentActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      
      // Fetch recent data from multiple collections
      const [employeesRes, tasksRes, leavesRes, attendancesRes] = await Promise.all([
        axiosInstance.get('/populate/read/employees?limit=2&sort={"createdAt":-1}'),
        axiosInstance.get('/populate/read/tasks?limit=2&sort={"createdAt":-1}'),
        axiosInstance.get('/populate/read/leaves?limit=1&sort={"createdAt":-1}'),
        axiosInstance.get('/populate/read/attendances?limit=2&sort={"createdAt":-1}')
      ]);

      const recentActivities = [
        ...(employeesRes.data?.data || []).map(emp => ({
          id: emp._id,
          type: 'employee',
          title: 'New Employee Joined',
          description: `${emp.basicInfo?.firstName} ${emp.basicInfo?.lastName}`,
          time: emp.createdAt,
          icon: User,
          avatar: emp.basicInfo?.profileImage,
          firstName: emp.basicInfo?.firstName,
          lastName: emp.basicInfo?.lastName
        })),
        ...(tasksRes.data?.data || []).map(task => ({
          id: task._id,
          type: 'task',
          title: 'New Task Created',
          description: task.title,
          time: task.createdAt,
          icon: CheckSquare
        })),
        ...(leavesRes.data?.data || []).map(leave => ({
          id: leave._id,
          type: 'leave',
          title: 'Leave Request',
          description: `${leave.employee?.basicInfo?.firstName || 'Employee'} requested leave`,
          time: leave.createdAt,
          icon: Calendar
        })),
        ...(attendancesRes.data?.data || []).map(att => ({
          id: att._id,
          type: 'attendance',
          title: 'Attendance Update',
          description: `${att.employee?.basicInfo?.firstName || 'Employee'} - ${att.status}`,
          time: att.createdAt,
          icon: Clock
        }))
      ];

      // Sort by time and take last 5
      const sortedActivities = recentActivities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getTypeColor = (type) => {
    const colors = {
      employee: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
      task: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
      leave: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
      attendance: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
    };
    return colors[type] || 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-6 ">
        <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg h-80 flex flex-col">
      <div className="p-6 pb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-black dark:text-white">Recent Activity</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-gray-100 dark:scrollbar-track-gray-900">
        {activities.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className={`p-2 rounded-full ${getTypeColor(activity.type)}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-black dark:text-white truncate">
                      {activity.title}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {formatTime(activity.time)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    {activity.avatar && (
                      <ProfileImage
                        profileImage={activity.avatar}
                        firstName={activity.firstName}
                        lastName={activity.lastName}
                        size="xs"
                      />
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {activity.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {activities.length > 0 && (
        <div className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;