/**
 * Centralized API Service
 * Consolidates all API calls to eliminate duplication
 */

import axios from 'axios';
import { SERVER_URL } from '../Utils/Constants';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: SERVER_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/sign-in';
    }
    if (error.response?.status === 429) {
      // Rate limited - extract retry-after header
      const retryAfter = error.response.headers['retry-after'] || 60;
      error.rateLimited = true;
      error.retryAfter = parseInt(retryAfter);
      // Show user-friendly message
      error.message = `Too many requests. Please try again in ${retryAfter} seconds.`;
    }
    return Promise.reject(error);
  }
);

// Generic API methods
const apiService = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await apiClient.get(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // File upload
  upload: async (url, formData, config = {}) => {
    try {
      const response = await apiClient.post(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config.headers,
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Error handler
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      message: data?.message || 'An error occurred',
      status,
      data: data?.data,
      errors: data?.errors,
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
    };
  }
};

// Specific API endpoints
export const eventApi = {
  // Get all events
  getAll: (params = {}) => apiService.get('/api/events', { params }),
  
  // Get event by ID
  getById: (id) => apiService.get(`/api/events/${id}`),
  
  // Get user events
  getUserEvents: (userId) => apiService.get(`/api/events/user/${userId}`),
  
  // Get related events
  getRelated: (eventId, params = {}) => apiService.get('/api/events/related', { params: { eventId, ...params } }),
  
  // Create event
  create: (data) => apiService.post('/api/events', data),
  
  // Update event
  update: (id, data) => apiService.put(`/api/events/${id}`, data),
  
  // Delete event
  delete: (id) => apiService.delete(`/api/events/${id}`),
  
  // Register for event
  register: (eventId, data) => apiService.post(`/api/events/${eventId}/register`, data),
  
  // Unregister from event
  unregister: (eventId) => apiService.delete(`/api/events/${eventId}/unregister`),
};

export const userApi = {
  // Get current user
  getCurrent: () => apiService.get('/api/users/me'),
  
  // Get user by ID
  getById: (id) => apiService.get(`/api/users/${id}`),
  
  // Update user
  update: (id, data) => apiService.put(`/api/users/${id}`, data),
  
  // Update notifications
  updateNotifications: (id, data) => apiService.put(`/api/users/${id}/notifications`, data),
  
  // Update privacy settings
  updatePrivacy: (id, data) => apiService.put(`/api/users/${id}/privacy`, data),
  
  // Delete user
  delete: (id) => apiService.delete(`/api/users/${id}`),
};

export const categoryApi = {
  // Get all categories
  getAll: () => apiService.get('/api/categories'),
  
  // Get category by ID
  getById: (id) => apiService.get(`/api/categories/${id}`),
};

export const taskApi = {
  // Get user tasks
  getUserTasks: (userId) => apiService.get(`/api/tasks/user/${userId}`),
  
  // Get event tasks
  getEventTasks: (eventId) => apiService.get(`/api/tasks/event/${eventId}`),
  
  // Create task
  create: (data) => apiService.post('/api/tasks', data),
  
  // Update task
  update: (id, data) => apiService.put(`/api/tasks/${id}`, data),
  
  // Delete task
  delete: (id) => apiService.delete(`/api/tasks/${id}`),
  
  // Get registered users for event
  getRegisteredUsers: (eventId) => apiService.get(`/api/orders/rgstduser/${eventId}`),
};

export const orderApi = {
  // Get user orders
  getUserOrders: (userId) => apiService.get(`/api/orders/user/${userId}`),
  
  // Create order
  create: (data) => apiService.post('/api/orders', data),
  
  // Update order
  update: (id, data) => apiService.put(`/api/orders/${id}`, data),
};

export const analyticsApi = {
  // Get event analytics
  getEventAnalytics: (eventId) => apiService.get(`/api/analytics/${eventId}`),
  
  // Get analytics report
  getReport: (eventId, format = 'json') => apiService.get(`/api/analytics/${eventId}/report?format=${format}`),
};

export const calendarApi = {
  // Get export options
  getExportOptions: (eventId) => apiService.get(`/api/calendar-export/${eventId}`),
  
  // Download iCal
  downloadICal: (eventId) => apiService.get(`/api/calendar-export/${eventId}/ical`, { responseType: 'blob' }),
  
  // Download Google Calendar
  downloadGoogle: (eventId) => apiService.get(`/api/calendar-export/${eventId}/google`),
  
  // Download Outlook
  downloadOutlook: (eventId) => apiService.get(`/api/calendar-export/${eventId}/outlook`),
  
  // Download Yahoo
  downloadYahoo: (eventId) => apiService.get(`/api/calendar-export/${eventId}/yahoo`),
};

export const templateApi = {
  // Get templates
  getAll: (params = {}) => apiService.get('/api/templates', { params }),
  
  // Get template by ID
  getById: (id) => apiService.get(`/api/templates/${id}`),
  
  // Create template
  create: (data) => apiService.post('/api/templates', data),
  
  // Update template
  update: (id, data) => apiService.put(`/api/templates/${id}`, data),
  
  // Delete template
  delete: (id) => apiService.delete(`/api/templates/${id}`),
};

export const collaborationApi = {
  // Get collaborators
  getCollaborators: (eventId) => apiService.get(`/api/collaboration/${eventId}/collaborators`),
  
  // Get roles
  getRoles: () => apiService.get('/api/collaboration/roles'),
  
  // Get permissions
  getPermissions: () => apiService.get('/api/collaboration/permissions'),
  
  // Add collaborator
  addCollaborator: (eventId, data) => apiService.post(`/api/collaboration/${eventId}/collaborators`, data),
  
  // Update collaborator
  updateCollaborator: (eventId, userId, data) => apiService.put(`/api/collaboration/${eventId}/collaborators/${userId}`, data),
  
  // Remove collaborator
  removeCollaborator: (eventId, userId) => apiService.delete(`/api/collaboration/${eventId}/collaborators/${userId}`),
};

export const communicationApi = {
  // Get service status
  getStatus: () => apiService.get('/api/communication/status'),
  
  // Send notification
  sendNotification: (data) => apiService.post('/api/communication/send', data),
  
  // Send event notification
  sendEventNotification: (eventId, data) => apiService.post(`/api/communication/events/${eventId}/notify`, data),
  
  // Send bulk notification
  sendBulkNotification: (eventId, data) => apiService.post(`/api/communication/events/${eventId}/attendees/notify`, data),
  
  // Send test notification
  sendTest: (data) => apiService.post('/api/communication/test', data),
};

export default apiService;