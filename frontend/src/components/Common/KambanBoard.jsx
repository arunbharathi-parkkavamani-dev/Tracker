import React, { useState } from "react";
import { MoreHorizontal, Plus, Filter, LayoutGrid, List as ListIcon, X, Check } from "lucide-react";

const KanbanBoard = ({
  data = [],
  groupBy = "",
  columns = [],
  onCardMove,
  currentUserId,
  onCardClick,
  title = "Tasks",
  subtitle = "Manage projects and track progress.",
  employees = [],
  taskTypes = [],
  kanbanView = 'status',
  onNewTask
}) => {
  const [draggingCard, setDraggingCard] = useState(null);
  const [highlightedColumn, setHighlightedColumn] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    status: null,
    category: null,
    createdBy: null,
    assignedTo: null,
    taskType: null
  });

  const getValue = (obj, path) => {
    const value = path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
    if (value && typeof value === 'object' && value.name) {
      return value.name;
    }
    return value;
  };

  const applyFilters = (tasks) => {
    return tasks.filter(task => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.category && getValue(task, 'projectTypeId') !== filters.category) return false;
      if (filters.createdBy && task.createdBy?._id !== filters.createdBy) return false;
      if (filters.assignedTo && !task.assignedTo?.some(user => user._id === filters.assignedTo)) return false;
      if (filters.taskType && getValue(task, 'taskTypeId') !== filters.taskType) return false;
      return true;
    });
  };

  const getTasksByColumn = (columnId) => {
    const filteredTasks = applyFilters(data).filter(task => {
      const taskValue = getValue(task, groupBy);
      return taskValue === columnId;
    });
    return filteredTasks;
  };

  const clearFilters = () => {
    setFilters({
      status: null,
      category: null,
      createdBy: null,
      assignedTo: null,
      taskType: null
    });
  };

  const statusOptions = ['Backlogs', 'To Do', 'In Progress', 'In Review', 'Approved', 'Completed'];
  const categoryOptions = [...new Set(data.map(task => getValue(task, 'projectTypeId')).filter(Boolean))];

  const handleDragStart = (e, item, fromColumn) => {
    if (item.createdBy?._id !== currentUserId) {
      e.preventDefault();
      return;
    }
    setDraggingCard({ item, fromColumn });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    setHighlightedColumn(column);
  };

  const handleDrop = (toColumn) => {
    if (!draggingCard) return;
    setHighlightedColumn(null);
    if (draggingCard.fromColumn !== toColumn) {
      onCardMove?.(draggingCard.item, draggingCard.fromColumn, toColumn);
    }
    setDraggingCard(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      'To Do': 'bg-blue-50 text-blue-700 border-blue-200',
      'In Progress': 'bg-orange-50 text-orange-700 border-orange-200', 
      'Done': 'bg-green-50 text-green-700 border-green-200',
      'Completed': 'bg-green-50 text-green-700 border-green-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const TaskCard = ({ task }) => {
    const isActivity = task.activity !== undefined;
    const title = isActivity ? task.activity : task.title;
    const userStory = task.userStory || task.description || '';
    const userStoryPreview = userStory.split('\n').slice(0, 2).join('\n').substring(0, 100) + (userStory.length > 100 ? '...' : '');
    const taskType = isActivity ? task.taskType?.name : task.taskTypeId?.name;
    const assignees = task.assignedTo || [];
    const createdBy = task.createdBy;
    const date = isActivity ? task.date : task.endDate || task.createdAt;
    
    return (
      <div 
        onClick={() => onCardClick?.(task)}
        draggable={task.createdBy?._id === currentUserId || task.user?._id === currentUserId}
        onDragStart={(e) => handleDragStart(e, task, getValue(task, groupBy))}
        className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
          draggingCard?.item?._id === task._id ? "opacity-25" : ""
        }`}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(task.status)}`}>
              {taskType || 'Task'}
            </span>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
          
          {/* Task Title */}
          <h3 className="text-sm font-semibold leading-tight text-black dark:text-white">
            {title || 'Untitled Task'}
          </h3>
          
          {/* User Story Preview (first two lines) */}
          {userStoryPreview && (
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {userStoryPreview}
            </p>
          )}
          
          {/* Assignees and Created By */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              {/* Assignees */}
              <div className="flex -space-x-2">
                {assignees.slice(0, 3).map((assignee, index) => (
                  assignee.basicInfo?.profileImage ? (
                    <img
                      key={index}
                      src={`http://10.232.224.208:3000/api/files/render/profile/${typeof assignee.basicInfo.profileImage === 'string' ? assignee.basicInfo.profileImage.split('/').pop() : assignee.basicInfo.profileImage}`}
                      alt={assignee.basicInfo?.firstName || 'User'}
                      className="h-6 w-6 rounded-full border-2 border-white dark:border-black object-cover"
                      title={`${assignee.basicInfo?.firstName} ${assignee.basicInfo?.lastName}`}
                    />
                  ) : (
                    <div 
                      key={index}
                      className="h-6 w-6 rounded-full bg-blue-100 border-2 border-white dark:border-black flex items-center justify-center text-xs font-medium text-blue-700"
                      title={`${assignee.basicInfo?.firstName} ${assignee.basicInfo?.lastName}`}
                    >
                      {assignee.basicInfo?.firstName?.[0]}{assignee.basicInfo?.lastName?.[0]}
                    </div>
                  )
                ))}
                {assignees.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white dark:border-black flex items-center justify-center text-xs font-medium text-gray-600">
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
              
              {/* Created By */}
              {createdBy && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <span className="mr-1">by</span>
                  {createdBy.basicInfo?.profileImage ? (
                    <img
                      src={`http://10.232.224.208:3000/api/files/render/profile/${typeof createdBy.basicInfo.profileImage === 'string' ? createdBy.basicInfo.profileImage.split('/').pop() : createdBy.basicInfo.profileImage}`}
                      alt={createdBy.basicInfo?.firstName || 'User'}
                      className="h-4 w-4 rounded-full object-cover mr-1"
                    />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 mr-1">
                      {createdBy.basicInfo?.firstName?.[0]}
                    </div>
                  )}
                  <span className="truncate max-w-[60px]">
                    {createdBy.basicInfo?.firstName}
                  </span>
                </div>
              )}
            </div>
            
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {date ? new Date(date).toLocaleDateString() : 'No due date'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-6">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">{title}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{subtitle}</p>
          </div>
          
          <div className="flex items-center gap-2 relative">
            
            {/* Filter Button */}
            <div className="relative">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-black dark:text-white bg-white dark:bg-black flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
                {Object.values(filters).some(f => f) && (
                  <span className="bg-blue-500 text-white rounded-full w-2 h-2"></span>
                )}
              </button>
              
              {/* Filter Dropdown */}
              {showFilter && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80 z-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-black dark:text-white">Filter Tasks</h3>
                    <button onClick={() => setShowFilter(false)} className="text-gray-500 hover:text-gray-700">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Status/Category Toggle */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                        {kanbanView === 'status' ? 'Category' : 'Status'}
                      </label>
                      <select 
                        value={kanbanView === 'status' ? filters.category || '' : filters.status || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          [kanbanView === 'status' ? 'category' : 'status']: e.target.value || null
                        }))}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">All {kanbanView === 'status' ? 'Categories' : 'Statuses'}</option>
                        {(kanbanView === 'status' ? categoryOptions : statusOptions).map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    {/* Created By */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-black dark:text-white">Created By</label>
                      <select 
                        value={filters.createdBy || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, createdBy: e.target.value || null }))}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">All Users</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>
                            {emp.basicInfo?.firstName} {emp.basicInfo?.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Assigned To */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-black dark:text-white">Assigned To</label>
                      <select 
                        value={filters.assignedTo || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value || null }))}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">All Employees</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>
                            {emp.basicInfo?.firstName} {emp.basicInfo?.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Task Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-black dark:text-white">Task Type</label>
                      <select 
                        value={filters.taskType || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, taskType: e.target.value || null }))}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">All Task Types</option>
                        {taskTypes.map(type => (
                          <option key={type._id} value={type.name}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button 
                      onClick={clearFilters}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-black dark:text-white"
                    >
                      Clear All
                    </button>
                    <button 
                      onClick={() => setShowFilter(false)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* New Task Button */}
            <button 
              onClick={onNewTask}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 h-full min-w-[1000px]">
            {columns.map((column) => {
              const columnTasks = getTasksByColumn(column.id);
              
              return (
                <div 
                  key={column.id} 
                  className="w-80 flex flex-col gap-3"
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={() => handleDrop(column.id)}
                  onDragLeave={() => setHighlightedColumn(null)}
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{column.title}</span>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2 py-1 text-xs">
                      {columnTasks.length}
                    </span>
                  </div>
                  
                  <div className={`flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 space-y-3 min-h-[500px] ${
                    highlightedColumn === column.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}>
                    {columnTasks.map((task) => (
                      <TaskCard key={task._id} task={task} />
                    ))}
                    
                    {columnTasks.length === 0 && (
                      <div className="text-center text-gray-400 py-6">
                        <div className="w-6 h-6 mx-auto mb-2 text-gray-300">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-xs">No tasks</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Add New Column */}
            <div className="w-80 flex flex-col gap-3">
              <div className="h-10"></div>
              <button className="h-auto py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex flex-col items-center justify-center">
                <Plus className="h-5 w-5 mb-2" />
                Add Column
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
