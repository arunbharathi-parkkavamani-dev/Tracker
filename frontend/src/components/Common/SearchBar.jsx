import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ data, onFilter, searchFields, placeholder = "Search..." }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (value) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      onFilter(data);
      return;
    }

    const filtered = data.filter(item => {
      return searchFields.some(field => {
        const fieldValue = getNestedValue(item, field);
        return fieldValue?.toString().toLowerCase().includes(value.toLowerCase());
      });
    });
    
    onFilter(filtered);
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onFilter(data);
  };

  return (
    <div className="relative w-64">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-[#7b7b78]" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-10 py-2 border border-[#d3cec6] rounded-[8px] focus:ring-1 focus:ring-[#111111] focus:border-[#111111] text-[13px] text-[#111111] placeholder:text-[#7b7b78] bg-white outline-none transition-colors"
      />
      {searchTerm && (
        <button
          onClick={clearSearch}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="h-4 w-4 text-[#7b7b78] hover:text-[#111111]" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;