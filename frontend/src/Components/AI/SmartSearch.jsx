import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Sparkles, X, Loader2, MapPin, Calendar, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../../Utils/Constants';
import debounce from 'lodash.debounce';

const SmartSearch = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isAIMode, setIsAIMode] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchSuggestions = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `${SERVER_URL}/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.data.suggestions || []);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    }, 300),
    []
  );

  const searchEvents = async (searchQuery) => {
    setLoading(true);
    try {
      const endpoint = isAIMode 
        ? `${SERVER_URL}/api/ai/search/natural`
        : `${SERVER_URL}/api/search/events`;
      
      const response = await fetch(`${endpoint}?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data.events || data.data || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      searchEvents(query);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
    
    // Detect if user is using natural language
    const naturalLanguagePatterns = /^(find|show|search for|looking for|events near|what|when|where)/i;
    setIsAIMode(naturalLanguagePatterns.test(value));
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
    onClose?.();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-3">
              {isAIMode ? (
                <Sparkles className="w-5 h-5 text-purple-500" />
              ) : (
                <Search className="w-5 h-5 text-gray-400" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search events or try 'Find tech events this weekend'"
                className="flex-1 text-lg outline-none placeholder-gray-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setSuggestions([]);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>
          </form>
          
          {isAIMode && (
            <div className="mt-2 flex items-center gap-2 text-xs text-purple-600">
              <Sparkles className="w-3 h-3" />
              <span>AI-powered natural language search enabled</span>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && !results.length && (
          <div className="p-2 border-b">
            <p className="px-2 py-1 text-xs text-gray-500 uppercase">Suggestions</p>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(suggestion);
                  searchEvents(suggestion);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:bg-gray-900 rounded flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-gray-400" />
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((event) => (
                <button
                  key={event._id}
                  onClick={() => handleEventClick(event._id)}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:bg-gray-900 rounded-lg transition-colors"
                >
                  <div className="flex gap-3">
                    {event.imageUrl && (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {event.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(event.startDateTime)}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                      {event.category && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          <Tag className="w-3 h-3" />
                          {event.category.name || event.category}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`font-medium ${event.isFree ? 'text-green-600' : 'text-gray-900'}`}>
                        {event.isFree ? 'Free' : `₹${event.price}`}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query && !loading ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No events found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords or use natural language</p>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-300" />
              <p className="font-medium">Smart Search</p>
              <p className="text-sm mt-1">
                Try natural queries like "tech events in Mumbai this weekend"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 dark:bg-gray-900 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <div className="flex gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">↵</kbd> to search</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">esc</kbd> to close</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartSearch;
