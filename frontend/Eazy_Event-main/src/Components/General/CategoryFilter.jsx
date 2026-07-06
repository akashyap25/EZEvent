import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Filter, ChevronDown } from 'lucide-react';
import Button from '../UI/Button';

const CategoryFilter = () => {
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/categories`);
        if (response.ok) {
          const data = await response.json();
          // Handle different response structures
          const categoriesArray = Array.isArray(data) ? data : (data.categories || data.data || []);
          
          // Ensure categoriesArray is actually an array
          if (Array.isArray(categoriesArray)) {
            setCategories([{ _id: 'all', name: 'All' }, ...categoriesArray]);
          } else {
            console.warn('Categories data is not an array:', categoriesArray);
            throw new Error('Invalid categories data format');
          }
        } else {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([{ _id: 'all', name: 'All' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const getCurrentCategory = () => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category') || 'All';
    return categories.find(cat => cat.name === category) || categories[0];
  };

  const handleCategoryChange = (category) => {
    const params = new URLSearchParams(location.search);
    
    if (category.name === 'All') {
      params.delete('category');
    } else {
      params.set('category', category.name);
    }
    
    navigate(`?${params.toString()}`, { replace: true });
    setIsOpen(false);
  };

  const currentCategory = getCurrentCategory();

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        icon={Filter}
        iconPosition="left"
        disabled={loading}
      >
        {loading ? 'Loading...' : (currentCategory?.name || 'All Categories')}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => handleCategoryChange(category)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  currentCategory?._id === category._id 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryFilter;