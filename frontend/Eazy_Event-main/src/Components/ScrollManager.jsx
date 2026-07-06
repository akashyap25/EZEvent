import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollManager = () => {
  const location = useLocation();
  const previousPathname = useRef(location.pathname);

  useEffect(() => {
    // Only scroll to top if the pathname has actually changed
    if (previousPathname.current !== location.pathname) {
      // Reset scroll position to top
      window.scrollTo(0, 0);
      
      // Update the previous pathname
      previousPathname.current = location.pathname;
    }
  }, [location.pathname]);

  return null;
};

export default ScrollManager;