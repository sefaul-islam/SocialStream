import React, { useState, useEffect, useCallback } from 'react';
import searchService from '../../services/searchService';

const SearchBar = ({
  placeholder = 'Search...',
  onSearch = () => {},
  onResults = () => {},
  className = '',
  debounceDelay = 500
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (!searchValue.trim()) {
      onResults([]);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchService.searchVideosByTitle(searchValue);
        onResults(results);
        onSearch(searchValue);
      } catch (error) {
        console.error('Search error:', error);
        onResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceDelay);

    return () => clearTimeout(timeoutId);
  }, [searchValue, debounceDelay, onResults, onSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already handled by the debounced effect
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
  };

  const handleClear = () => {
    setSearchValue('');
    onResults([]);
    onSearch('');
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className={`flex items-center bg-white/5 backdrop-blur-lg rounded-xl border-2 transition-all duration-300 ${
        isFocused 
          ? 'border-green-500 shadow-lg shadow-green-500/20' 
          : 'border-green-500/20 hover:border-green-500/40'
      }`}>
        {/* Search Icon */}
        <div className="pl-4">
          <svg 
            className={`w-5 h-5 transition-colors ${isFocused ? 'text-green-400' : 'text-gray-400'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={searchValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none px-4 py-3"
        />

        {/* Clear Button */}
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Search Button */}
        <button
          type="submit"
          disabled={isSearching}
          className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-r-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Searching...</span>
            </>
          ) : (
            'Search'
          )}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
