import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, Download, RefreshCw } from 'lucide-react';
import Pagination from './Pagination';

const TableGenerator = ({ 
  model,
  title = "Data Table",
  columns = [],
  searchable = true,
  sortable = true,
  pagination = true,
  itemsPerPage = 10,
  onRowClick = null,
  className = "",
  filters = {},
  autoRefresh = false,
  refreshInterval = 30000,
  showStats = false,
  exportable = false,
  bulkActions = false,
  selectedRows = [],
  onSelectionChange = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Use basic state management instead of optimized data fetching
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage
  });

  const handlePageChange = () => {};
  const handleItemsPerPageChange = () => {};
  const handleFilterChange = () => {};
  const handleSortChange = () => {};
  const handleRefresh = () => {};
  const handleSearch = () => {};

  // Auto-generate columns if not provided
  const autoColumns = data.length > 0 && columns.length === 0 
    ? Object.keys(data[0]).map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        render: (value) => value?.toString() || '-',
        sortable: true,
        searchable: true
      }))
    : columns;

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (model && searchable) {
        handleSearch(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearch, model, searchable]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !model) return;
    
    const interval = setInterval(handleRefresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, handleRefresh, model]);

  const handleSort = (key) => {
    if (!sortable) return;
    
    if (model) {
      // For server-side sorting
      handleSortChange({ [key]: 1 }); // Toggle logic can be added
    }
  };

  const handleExport = async () => {
    try {
      // Convert to CSV
      const csvContent = convertToCSV(data, autoColumns);
      downloadCSV(csvContent, `${model || 'data'}_export_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const convertToCSV = (data, columns) => {
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(item => 
      columns.map(col => {
        const value = item[col.key];
        return `"${value?.toString().replace(/"/g, '""') || ''}"`;
      }).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const renderCellValue = (item, column) => {
    const value = item[column.key];
    return column.render ? column.render(value, item) : (value?.toString() || '-');
  };

  return (
    <div className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-black dark:text-white">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {paginationInfo.totalItems || data.length} {(paginationInfo.totalItems || data.length) === 1 ? 'item' : 'items'}
            </span>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {exportable && (
              <button
                onClick={handleExport}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {bulkActions && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectionChange?.(data.map(item => item._id));
                        } else {
                          onSelectionChange?.([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                {autoColumns.map((column) => (
                  <th
                    key={column.key}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((item, index) => (
                <tr
                  key={item._id || index}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                >
                  {bulkActions && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onSelectionChange?.([...selectedRows, item._id]);
                          } else {
                            onSelectionChange?.(selectedRows.filter(id => id !== item._id));
                          }
                        }}
                        className="rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {autoColumns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white">
                      {renderCellValue(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}

      {/* Pagination */}
      {pagination && paginationInfo.totalPages > 1 && (
        <Pagination
          currentPage={paginationInfo.currentPage}
          totalPages={paginationInfo.totalPages}
          totalItems={paginationInfo.totalItems}
          itemsPerPage={paginationInfo.itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showItemsPerPage={true}
          showPageInfo={true}
          showJumpToPage={paginationInfo.totalPages > 10}
        />
      )}
    </div>
  );
};

export default TableGenerator;