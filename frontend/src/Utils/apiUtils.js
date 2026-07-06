/**
 * Utility functions for handling API responses
 * Note: apiService already unwraps axios response (returns response.data)
 * So these functions receive the server response directly: { success, data, message }
 */

/**
 * Extracts data from API response, handling both formats
 * @param {Object} response - Server response (already unwrapped by apiService)
 * @param {*} fallback - Fallback value if data is not found
 * @returns {*} - Extracted data
 */
export const extractApiData = (response, fallback = null) => {
  if (!response) return fallback;

  // Format: { success: true, data: [...] } (from apiService which returns response.data)
  if (response.success && response.data !== undefined) {
    return response.data;
  }

  // Direct data format (raw array or object from older endpoints)
  if (Array.isArray(response)) return response;
  
  // Nested: response still has .data (raw axios response passed directly)
  if (response.data !== undefined) {
    if (response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  }

  return response || fallback;
};

/**
 * Extracts array data from API response with safety checks
 * @param {Object} response - Axios response object
 * @param {Array} fallback - Fallback array if data is not found or not an array
 * @returns {Array} - Extracted array data
 */
export const extractApiArray = (response, fallback = []) => {
  const data = extractApiData(response, fallback);
  return Array.isArray(data) ? data : fallback;
};

/**
 * Extracts object data from API response with safety checks
 * @param {Object} response - Axios response object
 * @param {Object} fallback - Fallback object if data is not found
 * @returns {Object} - Extracted object data
 */
export const extractApiObject = (response, fallback = {}) => {
  const data = extractApiData(response, fallback);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : fallback;
};

/**
 * Checks if API response indicates success
 * @param {Object} response - Axios response object
 * @returns {boolean} - True if response indicates success
 */
export const isApiSuccess = (response) => {
  // apiService already unwraps - check response.success directly
  if (response && response.success === true) return true;
  // Fallback for raw axios response
  return response && response.data && response.data.success === true;
};

/**
 * Extracts error message from API response
 * @param {Object} error - Axios error object
 * @returns {string} - Error message
 */
export const extractApiError = (error) => {
  // apiService throws { message, status } objects
  if (error.message) {
    return error.message;
  }
  // Raw axios error format
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  
  return 'An unexpected error occurred';
};