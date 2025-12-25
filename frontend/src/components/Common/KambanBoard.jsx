import React, { useState } from "react";
import { MdMoreVert } from "react-icons/md";

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
        className={`bg-white rounded-lg shadow-sm border p-2 mb-2 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${
          draggingCard?.item?._id === task._id ? "opacity-25" : ""
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-xs font-medium text-gray-900 line-clamp-2 flex-1">
            {title || 'Untitled Activity'}
          </h4>
          <button className="text-gray-400 hover:text-gray-600 ml-1">
            <MdMoreVert size={14} />
          </button>
        </div>
        
        {taskType && (
          <div className="mb-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {taskType}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            {date && (
              <span className="text-xs">{new Date(date).toLocaleDateString()}</span>
            )}
          </div>
          
          {user && (
            <div className="flex items-center gap-1">
              {user.basicInfo?.profileImage ? (
                <img
                  src={`http://10.232.224.208:3000/api/files/render/profile/${typeof user.basicInfo.profileImage === 'string' ? user.basicInfo.profileImage.split('/').pop() : user.basicInfo.profileImage}`}
                  alt={user.basicInfo?.firstName || 'User'}
                  className="w-4 h-4 rounded-full object-cover border border-white"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border border-white">
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
    <div className="w-full overflow-x-auto overflow-y-hidden">
      <div className="flex gap-3 p-2 w-max min-w-full">
        {columns.map((column) => {
          const columnTasks = getTasksByColumn(column.id);
          
          return (
            <div 
              key={column.id} 
              className={`flex-none w-60 transition-transform duration-200 ${
                highlightedColumn === column.id ? "scale-[1.02]" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={() => handleDrop(column.id)}
              onDragLeave={() => setHighlightedColumn(null)}
            >
              <div className={`${column.color} text-white rounded-t-lg p-2 flex items-center justify-between`}>
                <h3 className="font-medium text-sm truncate pr-2">{column.title}</h3>
                <span className="bg-white bg-opacity-20 px-1.5 py-0.5 rounded text-xs font-medium text-black flex-shrink-0">
                  {columnTasks.length}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-b-lg p-2 h-80 overflow-y-auto">
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
                    <p className="text-xs">No activities</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
