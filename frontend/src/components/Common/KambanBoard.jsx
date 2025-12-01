import React, { useState } from "react";
import { MdMoreVert, MdAttachment, MdComment } from "react-icons/md";

const KanbanBoard = ({
  data = [],
  groupBy = "",
  columns = [],
  onCardMove,
  currentUserId,
  onCardClick,
}) => {
  const [draggingCard, setDraggingCard] = useState(null);
  const [highlightedColumn, setHighlightedColumn] = useState(null);

  const getValue = (obj, path) =>
    path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);

  const getTasksByColumn = (columnId) => {
    return data.filter(task => getValue(task, groupBy) === columnId);
  };

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

  const TaskCard = ({ task }) => {
    // Handle both task and activity data structures
    const isActivity = task.activity !== undefined;
    const title = isActivity ? task.activity : task.title;
    const taskType = isActivity ? task.taskType?.name : task.taskTypeId?.name;
    const user = isActivity ? task.user : (task.assignedTo?.[0] || task.createdBy);
    const date = isActivity ? task.date : task.createdAt;
    
    return (
      <div 
        onClick={() => onCardClick?.(task)}
        draggable={task.createdBy?._id === currentUserId || task.user?._id === currentUserId}
        onDragStart={(e) => handleDragStart(e, task, getValue(task, groupBy))}
        className={`bg-white rounded-lg shadow-sm border p-3 mb-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${
          draggingCard?.item?._id === task._id ? "opacity-25" : ""
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
            {title || 'Untitled Activity'}
          </h4>
          <button className="text-gray-400 hover:text-gray-600 ml-2">
            <MdMoreVert size={16} />
          </button>
        </div>
        
        {taskType && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {taskType}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {date && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date(date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          {user && (
            <div className="flex items-center gap-1">
              {user.basicInfo?.profileImage ? (
                <img
                  src={`http://10.11.244.208:3000/api/files/render/profile/${typeof user.basicInfo.profileImage === 'string' ? user.basicInfo.profileImage.split('/').pop() : user.basicInfo.profileImage}`}
                  alt={user.basicInfo?.firstName || 'User'}
                  className="w-5 h-5 rounded-full object-cover border border-white"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border border-white">
                  {user.basicInfo?.firstName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-6 min-w-max pb-4">
      {columns.map((column) => {
        const columnTasks = getTasksByColumn(column.id);
        
        return (
          <div 
            key={column.id} 
            className={`flex-shrink-0 w-80 min-w-80 transition-transform duration-200 ${
              highlightedColumn === column.id ? "scale-[1.02]" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={() => handleDrop(column.id)}
            onDragLeave={() => setHighlightedColumn(null)}
          >
            <div className={`${column.color} text-white rounded-t-lg p-3 flex items-center justify-between`}>
              <h3 className="font-medium">{column.title}</h3>
              <span className="bg-white bg-opacity-20 p-2 py-1 rounded text-sm font-medium">
                {columnTasks.length}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-b-lg p-3 h-[calc(100vh-20rem)] overflow-y-auto">
              {columnTasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
              
              {columnTasks.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm">No activities</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
