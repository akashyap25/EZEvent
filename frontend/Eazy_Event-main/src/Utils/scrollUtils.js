/**
 * Scroll to top of the page
 * @param {string} behavior - 'smooth' or 'instant'
 * @param {number} delay - Delay in milliseconds before scrolling
 */
export const scrollToTop = (behavior = 'smooth', delay = 0) => {
  const scroll = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: behavior
    });
  };

  if (delay > 0) {
    setTimeout(scroll, delay);
  } else {
    scroll();
  }
};

/**
 * Scroll to a specific element
 * @param {string} elementId - ID of the element to scroll to
 * @param {string} behavior - 'smooth' or 'instant'
 * @param {number} offset - Offset from the top of the element
 */
export const scrollToElement = (elementId, behavior = 'smooth', offset = 0) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
      top: elementPosition,
      left: 0,
      behavior: behavior
    });
  }
};

/**
 * Check if user has scrolled past a certain point
 * @param {number} threshold - Scroll threshold in pixels
 * @returns {boolean} - True if scrolled past threshold
 */
export const isScrolledPast = (threshold = 100) => {
  return window.pageYOffset > threshold;
};

/**
 * Get current scroll position
 * @returns {number} - Current scroll position in pixels
 */
export const getScrollPosition = () => {
  return window.pageYOffset || document.documentElement.scrollTop;
};