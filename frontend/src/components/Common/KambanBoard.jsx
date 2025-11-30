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

  const TaskCard = ({ task }) => (
    <div 
      onClick={() => onCardClick?.(task)}
      draggable={task.createdBy?._id === currentUserId}
      onDragStart={(e) => handleDragStart(e, task, getValue(task, groupBy))}
      className={`bg-white rounded-lg shadow-sm border p-3 mb-3 cursor-pointer hover:shadow-md transition-shadow ${
        draggingCard?.item?._id === task._id ? "opacity-25" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
          {task.title}
        </h4>
        <button className="text-gray-400 hover:text-gray-600 ml-2">
          <MdMoreVert size={16} />
        </button>
      </div>
      
      {task.userStory && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {task.userStory}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <MdComment size={12} />
            <span>1</span>
          </div>
        </div>
        
        {task.assignedTo && task.assignedTo.filter(Boolean).length > 0 && (
          <div className="flex -space-x-1">
            {task.assignedTo.filter(Boolean).slice(0, 2).map((user, index) => (
              <div
                key={user._id || index}
                className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white"
              >
                {user.basicInfo?.firstName?.charAt(0) || 'U'}
              </div>
            ))}
            {task.assignedTo.filter(Boolean).length > 2 && (
              <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center border-2 border-white">
                +{task.assignedTo.filter(Boolean).length - 2}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex gap-4 min-w-max pb-4">
      {columns.map((column) => {
        const columnTasks = getTasksByColumn(column.id);
        
        return (
          <div 
            key={column.id} 
            className={`flex-shrink-0 w-80 ${
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
            
            <div className="bg-gray-50 rounded-b-lg p-3 min-h-96 max-h-96 overflow-y-auto">
              {columnTasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
              
              {columnTasks.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No tasks
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
