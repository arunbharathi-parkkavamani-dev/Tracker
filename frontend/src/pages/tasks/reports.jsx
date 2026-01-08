import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import TableGenerator from '../../components/Common/TableGenerator';
import { BarChart3, PieChart, Calendar, Filter, TrendingUp } from 'lucide-react';
const TaskReports = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState('status');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    useEffect(() => {
        fetchReport();
    }, [reportType, dateRange]);
    const fetchReport = async () => {
        setLoading(true);
        try {
            const reportConfig = getReportConfig(reportType);
            const response = await axiosInstance.post('/populate/report/tasks', {
                ...reportConfig,
                dateRange: {
                    ...dateRange,
                    dateField: 'createdAt'
                }
            });
            setReportData(response.data || []);
        } catch (error) {
            console.error('Error fetching report:', error);
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };
    const getReportConfig = (type) => {
        const configs = {
            status: {
                type: 'summary',
                groupBy: 'status'
            },
            priority: {
                type: 'summary',
                groupBy: 'priorityLevel'
            },
            client: {
                type: 'summary',
                groupBy: 'clientId',
                populate: ['clientId']
            },
            assignee: {
                type: 'summary',
                groupBy: 'assignedTo',
                populate: ['assignedTo']
            },
            taskType: {
                type: 'summary',
                groupBy: 'taskTypeId',
                populate: ['taskTypeId']
            },
            projectType: {
                type: 'summary',
                groupBy: 'projectTypeId',
                populate: ['projectTypeId']
            },
            monthly: {
                type: 'summary',
                groupBy: 'createdAt',
                dateGrouping: 'month'
            },
            completion: {
                type: 'summary',
                groupBy: 'status',
                filter: { status: { $in: ['Completed', 'Approved'] } }
            }
        };
        return configs[type] || configs.status;
    };
    const customRender = {
        _id: (row) => {
            if (reportType === 'assignee' && row.name) {
                return <span className="font-medium">{row.name}</span>;
            }
            if (reportType === 'client' && row.name) {
                return <span className="font-medium">{row.name}</span>;
            }
            if (reportType === 'taskType' && row.name) {
                return <span className="font-medium">{row.name}</span>;
            }
            if (reportType === 'projectType' && row.name) {
                return <span className="font-medium">{row.name}</span>;
            }
            return <span className="font-medium">{row._id || 'Unassigned'}</span>;
        },
        count: (row) => {
            const colors = {
                'Completed': 'bg-green-100 text-green-800',
                'In Progress': 'bg-blue-100 text-blue-800',
                'To Do': 'bg-orange-100 text-orange-800',
                'High': 'bg-red-100 text-red-800',
                'Medium': 'bg-yellow-100 text-yellow-800',
                'Low': 'bg-green-100 text-green-800'
            };
            const colorClass = colors[row._id] || 'bg-blue-100 text-blue-800';
            return (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
                    {row.count}
                </span>
            );
        }
    };
    const reportOptions = [
        { value: 'status', label: 'By Status', icon: BarChart3 },
        { value: 'priority', label: 'By Priority', icon: TrendingUp },
        { value: 'client', label: 'By Client', icon: PieChart },
        { value: 'assignee', label: 'By Assignee', icon: PieChart },
        { value: 'taskType', label: 'By Task Type', icon: Filter },
        { value: 'projectType', label: 'By Project Type', icon: Filter },
        { value: 'monthly', label: 'Monthly Trend', icon: Calendar },
        { value: 'completion', label: 'Completion Rate', icon: BarChart3 }
    ];
    const totalTasks = reportData.reduce((sum, item) => sum + (item.count || 0), 0);
    const avgTasksPerGroup = totalTasks / (reportData.length || 1);
    const completedTasks = reportData.filter(item =>
        ['Completed', 'Approved'].includes(item._id)
    ).reduce((sum, item) => sum + (item.count || 0), 0);
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Task Reports</h1>
                    <p className="text-gray-600 text-sm">Analytics and insights for task management</p>
                </div>
            </div>
            {/* Controls */}
            <div className="bg-white rounded-lg border p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {reportOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Loading...' : 'Generate Report'}
                        </button>
                    </div>
                </div>
            </div>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-blue-500" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                            <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center">
                        <PieChart className="h-8 w-8 text-green-500" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Categories</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-purple-500" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Avg per Category</p>
                            <p className="text-2xl font-bold text-gray-900">{Math.round(avgTasksPerGroup)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-orange-500" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Report Table */}
            <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Report Data - {reportOptions.find(opt => opt.value === reportType)?.label}</h2>
                </div>
                <TableGenerator
                    data={reportData}
                    customRender={customRender}
                    hiddenColumns={[]}
                    enableActions={false}
                />
            </div>
        </div>
    );
};
export default TaskReports;