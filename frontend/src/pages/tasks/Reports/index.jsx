import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import { useAuth } from '../../../context/authProvider';

const ReportsPage = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTaskReports();
  }, [user]);

  const fetchTaskReports = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/populate/reports/tasks', {
        params: {
          groupBy: 'assignedTo',
          subGroupBy: 'status',
          userId: user?.id
        }
      });
      setReportData(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch task reports');
      console.error('Task reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'To Do': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'In Review': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Approved': 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading task reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Task Reports</h1>
        
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Tasks by Assignee and Status</h2>
          </div>
          
          <div className="p-6">
            {reportData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No task data available
              </div>
            ) : (
              <div className="space-y-6">
                {reportData.map((group, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-md font-medium text-gray-900">
                        {group.assigneeName || 'Unassigned'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Total Tasks: {group.totalTasks || 0}
                      </p>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.statusBreakdown?.map((statusGroup, statusIndex) => (
                          <div key={statusIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                getStatusColor(statusGroup.status)
                              }`}>
                                {statusGroup.status}
                              </span>
                              <span className="text-lg font-semibold text-gray-900">
                                {statusGroup.count}
                              </span>
                            </div>
                            
                            {statusGroup.tasks && statusGroup.tasks.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Tasks:</h4>
                                <div className="space-y-1">
                                  {statusGroup.tasks.slice(0, 3).map((task, taskIndex) => (
                                    <div key={taskIndex} className="text-xs text-gray-600 truncate">
                                      {task.title}
                                    </div>
                                  ))}
                                  {statusGroup.tasks.length > 3 && (
                                    <div className="text-xs text-gray-500">
                                      +{statusGroup.tasks.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )) || (
                          <div className="text-sm text-gray-500">No status breakdown available</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;