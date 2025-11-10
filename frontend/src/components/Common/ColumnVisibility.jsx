import { useState, useRef, useEffect } from "react";

export default function ColumnVisibility({
  columns,
  selectedCols,
  toggleColumn,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Column Visibility
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-2 w-56 bg-white border rounded-md shadow-lg p-3"
        >
          {columns.map((col) => (
            <label
              key={col}
              className="flex items-center justify-between p-2 rounded hover:bg-blue-50 cursor-pointer"
            >
              <span
                className={`text-gray-700 ${
                  selectedCols.includes(col) ? "font-semibold" : "text-gray-400"
                }`}
              >
                {col}
              </span>
              <input
                type="checkbox"
                checked={selectedCols.includes(col)}
                onChange={() => toggleColumn(col)}
                className="accent-blue-500"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
