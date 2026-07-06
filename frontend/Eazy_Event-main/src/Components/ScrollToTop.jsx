import useScrollToTop from '../hooks/useScrollToTop';

const ScrollToTop = () => {
  // Use the custom hook for scroll to top functionality
  useScrollToTop('smooth', 100);

  return null; // This component doesn't render anything
};

export default ScrollToTop;