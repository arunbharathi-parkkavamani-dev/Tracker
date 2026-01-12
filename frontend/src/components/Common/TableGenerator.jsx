import { useEffect, useMemo, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
} from "lucide-react";
import SearchBar from "./SearchBar";

/* -------------------- Helpers -------------------- */

// Indian date formatting utility
const formatIndianDate = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeFormat = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  if (inputDate.getTime() === today.getTime()) {
    // Today - show only time
    return timeFormat;
  } else if (inputDate.getTime() === yesterday.getTime()) {
    // Yesterday - show "Yesterday, time"
    return `Yesterday, ${timeFormat}`;
  } else if (date.getFullYear() === now.getFullYear()) {
    // Same year - show date, month, time
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } else {
    // Different year - show date, month, year, time
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
};

// Check if a value is a date string
const isDateString = (value) => {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.includes('T');
};

// camelCase → Capitalized Words
const formatColumnName = (key) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const normalizeData = (data) => {
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null) return Object.values(data);
  return [];
};

// number + string safe sorting
const sortData = (data, key, direction) => {
  return [...data].sort((a, b) => {
    const A = a[key];
    const B = b[key];

    if (A == null) return 1;
    if (B == null) return -1;

    const isNumA = !isNaN(A);
    const isNumB = !isNaN(B);

    if (isNumA && isNumB) {
      return direction === "asc" ? A - B : B - A;
    }

    return direction === "asc"
      ? String(A).localeCompare(String(B), undefined, { numeric: true })
      : String(B).localeCompare(String(A), undefined, { numeric: true });
  });
};

const ROWS_PER_PAGE = 10;

/* -------------------- Component -------------------- */

const TableGenerator = ({
  data,
  customRender = {},
  customColumns = [],
  hiddenColumns = [],
  enableActions = true,
  onEdit,
  onDelete,
}) => {
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  /* Init */
  useEffect(() => {
    const normalized = normalizeData(data);
    setTableData(normalized);
    setFilteredData(normalized);
    setCurrentPage(1);

    if (customColumns.length > 0) {
      setColumns(enableActions ? [...customColumns, "__actions"] : customColumns);
    } else if (normalized.length > 0) {
      const keys = Object.keys(normalized[0]).filter(key => !hiddenColumns.includes(key));
      setColumns(enableActions ? [...keys, "__actions"] : keys);
    }
  }, [data, enableActions, hiddenColumns]);

  /* Sorting */
  const sortedData = useMemo(() => {
    if (!sortConfig.key || sortConfig.key === "__actions")
      return filteredData;
    return sortData(filteredData, sortConfig.key, sortConfig.direction);
  }, [filteredData, sortConfig]);

  /* Pagination */
  const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return sortedData.slice(start, start + ROWS_PER_PAGE);
  }, [sortedData, currentPage]);

  const handleSort = (col) => {
    if (col === "__actions") return;
    setSortConfig((prev) => ({
      key: col,
      direction:
        prev.key === col && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  /* -------------------- Render -------------------- */

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <SearchBar
          data={tableData}
          searchFields={columns.filter((c) => c !== "__actions" && !hiddenColumns.includes(c))}
          placeholder="Search records..."
          onFilter={(d) => {
            setFilteredData(d);
            setCurrentPage(1);
          }}
        />
      </div>

      {paginatedData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No records found</div>
          <div className="text-gray-500 text-sm">Try adjusting your search criteria</div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  {columns.map((col) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider select-none cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {col === "__actions"
                          ? "Actions"
                          : formatColumnName(col)}
                        {sortConfig.key === col &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp size={14} className="text-blue-600" />
                          ) : (
                            <ChevronDown size={14} className="text-blue-600" />
                          ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {paginatedData.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50 transition-colors duration-150">
                    {columns.map((col) => (
                      <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {col === "__actions" ? (
                          customRender.__actions ? (
                            customRender.__actions(row)
                          ) : (
                            <div className="flex items-center gap-3">
                              {onEdit && (
                                <button
                                  onClick={() => onEdit(row)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                                  title="Edit"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(row)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          )
                        ) : customRender[col] ? (
                          customRender[col](row)
                        ) : isDateString(row[col]) ? (
                          <span className="font-medium">{formatIndianDate(row[col])}</span>
                        ) : (
                          <span className="font-medium">{row[col] ?? "-"}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1} to {Math.min(currentPage * ROWS_PER_PAGE, sortedData.length)} of {sortedData.length} results
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronsLeft size={16} />
              </button>

              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${currentPage === i + 1
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TableGenerator;
