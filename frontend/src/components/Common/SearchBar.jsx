import { useState, useRef, useEffect } from "react";
import { MdSearch, MdClear } from "react-icons/md";

const SearchBar = ({ 
  value = "", 
  onChange, 
  placeholder = "Search...", 
  className = "",
  onClear,
  disabled = false,
  suggestions = [],
  onSuggestionSelect,
  renderSuggestion,
  noSuggestionsText = "No results found"
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
    setShowSuggestions(false);
  };

  const handleInputChange = (newValue) => {
    onChange(newValue);
    setShowSuggestions(newValue.length > 0 && suggestions.length > 0);
  };

  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else {
      onChange(typeof suggestion === 'string' ? suggestion : suggestion.name || suggestion.title || '');
    }
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (value.length > 0 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative flex items-center">
        {/* <MdSearch className="absolute left-3 text-gray-500 dark:text-gray-400" size={20} /> */}
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600 focus:border-blue-800 dark:focus:border-blue-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
            type="button"
          >
            <MdClear size={16} />
          </button>
        )}
      </div>
      
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 z-50 max-h-60 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-sm text-black dark:text-white"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {renderSuggestion ? renderSuggestion(suggestion) : (
                  <span>{typeof suggestion === 'string' ? suggestion : suggestion.name || suggestion.title || 'Item'}</span>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
              {noSuggestionsText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;