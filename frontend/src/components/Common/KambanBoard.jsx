import React, { useState } from "react";
import FloatingCard from "./FloatingCard.jsx";

const KanbanBoard = ({
  data = [],
  groupBy = "",
  getCardContent,
  bgColors = {},
  onCardMove,
  currentUserId, // 🆕 Permission check passed by parent
}) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [draggingCard, setDraggingCard] = useState(null);
  const [highlightedColumn, setHighlightedColumn] = useState(null);

  const getValue = (obj, path) =>
    path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);

  const grouped = data.reduce((acc, item) => {
    const key = getValue(item, groupBy) || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const openModal = (item) => setSelectedCard(item);
  const closeModal = () => setSelectedCard(null);

  /** 🔹 Drag event handlers */
  const handleDragStart = (e, item, fromColumn) => {
    if (item.createdBy?._id !== currentUserId) {
      e.preventDefault();
      return; // ❌ not allowed
    }

    setDraggingCard({ item, fromColumn });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    setHighlightedColumn(column); // 🟢 Highlight this column
  };

  const handleDrop = (toColumn) => {
    if (!draggingCard) return;

    setHighlightedColumn(null);

    if (draggingCard.fromColumn !== toColumn) {
      onCardMove?.(draggingCard.item, draggingCard.fromColumn, toColumn);
    }

    setDraggingCard(null);
  };

  const handleDragLeave = (column) => {
    if (highlightedColumn === column) setHighlightedColumn(null);
  };

  return (
    <>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {Object.keys(grouped).map((column) => (
          <div
            key={column}
            className={`w-80 flex-shrink-0 rounded-xl overflow-hidden border transition ${
              highlightedColumn === column
                ? "border-blue-500 shadow-lg scale-[1.02]" // 🟢 Highlight effect
                : "border-gray-300"
            }`}
            style={{ backgroundColor: bgColors[column] || "#F3F4F6" }}
            onDragOver={(e) => handleDragOver(e, column)}
            onDrop={() => handleDrop(column)}
            onDragLeave={() => handleDragLeave(column)}
          >
            {/* Column Header */}
            <div className="text-center py-2 bg-white shadow">
              <h2 className="text-lg font-semibold text-gray-800">
                {column} ({grouped[column].length})
              </h2>
            </div>

            {/* Cards */}
            <div className="p-3 space-y-3 overflow-y-auto max-h-[70vh]">
              {grouped[column].map((item) => (
                <div
                  key={item._id}
                  onClick={() => openModal(item)}
                  draggable={item.createdBy?._id === currentUserId} // 🔒 permission
                  onDragStart={(e) => handleDragStart(e, item, column)}
                  className={`bg-white border rounded-xl p-3 cursor-pointer transition 
                    ${
                      draggingCard?.item?._id === item._id
                        ? "opacity-25 scale-[0.98]"
                        : "hover:shadow-md"
                    }
                    ${
                      item.createdBy?._id !== currentUserId
                        ? "cursor-not-allowed opacity-70"
                        : ""
                    }
                  `}
                >
                  {getCardContent(item)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating modal */}
      {selectedCard && (
        <FloatingCard onClose={closeModal}>
          {getCardContent(selectedCard, true)}
        </FloatingCard>
      )}
    </>
  );
};

export default KanbanBoard;
