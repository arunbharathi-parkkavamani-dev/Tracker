import React from "react";

/**
 * Reusable Kanban Board Component
 * 
 * Props:
 * - title: optional dynamic board title
 * - data: array of objects to display
 * - groupBy: field to group columns (example: "projectType.name")
 * - onCardClick: callback for clicking a card
 * - getCardContent: callback to render card UI
 * - bgColors: optional object { columnName: bgColor }
 */
const KanbanBoard = ({
  data = [],
  groupBy = "",
  onCardClick,
  getCardContent,
  bgColors = {},
}) => {
  // Utility: get nested field safely (e.g., projectType.name)
  const getValue = (obj, path) =>
    path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);

  // Group data based on field
  const grouped = data.reduce((acc, item) => {
    const key = getValue(item, groupBy) || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="flex gap-6 h-[calc(100vh-6rem)] relative overflow-x-auto">
      {Object.keys(grouped).map((column) => (
        <div
          key={column}
          className="relative w-80 flex-shrink-0 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: bgColors[column] || "#F3F4F6",
            height: "100%",
          }}
        >
          {/* Column Title */}
          <div className="text-center py-2 bg-white shadow">
            <h2 className="text-lg font-semibold text-gray-800">{column}</h2>
          </div>

          {/* Items */}
          <div className="absolute inset-3 overflow-y-auto p-4 z-20 space-y-3">
            {grouped[column].map((item) => (
              <div
                key={item._id}
                onClick={() => onCardClick?.(item)}
                className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition cursor-pointer relative z-30"
              >
                {getCardContent(item)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
