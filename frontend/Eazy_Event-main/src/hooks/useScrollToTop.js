import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useScrollToTop = (behavior = 'smooth', delay = 100) => {
  const location = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: behavior
        });
      }
    };

    // Add a small delay to ensure the page has rendered
    const timer = setTimeout(scrollToTop, delay);

    // Cleanup timer
    return () => clearTimeout(timer);
  }, [location.pathname, behavior, delay]);
};

export default useScrollToTop;