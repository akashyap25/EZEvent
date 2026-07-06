import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search as SearchIcon, X as CloseIcon } from 'lucide-react';
import Input from '../UI/Input';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('query') || '';
    setSearchQuery(query);
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    
    if (searchQuery.trim()) {
      params.set('query', searchQuery.trim());
    } else {
      params.delete('query');
    }
    
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleClear = () => {
    setSearchQuery('');
    const params = new URLSearchParams(location.search);
    params.delete('query');
    navigate(`?${params.toString()}`, { replace: true });
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <Input
        type="text"
        placeholder="Search events, organizers, or categories..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<SearchIcon className="h-4 w-4 text-gray-400" />}
        rightIcon={
          searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )
        }
        className="w-full"
      />
    </form>
  );
};

export default Search;