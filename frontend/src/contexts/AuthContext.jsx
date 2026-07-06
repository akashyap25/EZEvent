import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../Utils/Constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Initialize tokens from localStorage on mount
  useEffect(() => {
    // Clear old tokens first
    const oldToken = localStorage.getItem('authToken');
    if (oldToken) {
      localStorage.removeItem('authToken');
    }
    
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Set up axios interceptor to include token in requests
  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await axios.post(`${SERVER_URL}/api/users/login`, credentials);
      
      const { user: userInfo, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
      
      setUser(userInfo);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post(`${SERVER_URL}/api/users/register`, userData);
      const { user: userInfo, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
      
      setUser(userInfo);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint to blacklist token
      if (accessToken) {
        await axios.post(`${SERVER_URL}/api/users/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Get current user
  const getCurrentUser = async () => {
    try {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      // Use the /me endpoint to get current user info
      const response = await axios.get(`${SERVER_URL}/api/users/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      // If token is invalid or expired, try to refresh it
      if (error.response?.status === 401 || error.response?.status === 403) {
        await handleTokenRefresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // Token refresh function (with deduplication to prevent infinite loops)
  const refreshingRef = React.useRef(false);
  const handleTokenRefresh = async () => {
    // Prevent multiple simultaneous refresh attempts
    if (refreshingRef.current) return false;
    refreshingRef.current = true;

    try {
      if (!refreshToken) {
        logout();
        window.location.href = '/sign-in';
        return false;
      }

      const response = await axios.post(`${SERVER_URL}/api/users/refresh-token`, {
        refreshToken: refreshToken
      });

      const { accessToken: newAccessToken } = response.data;
      setAccessToken(newAccessToken);
      localStorage.setItem('accessToken', newAccessToken);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      window.location.href = '/sign-in';
      return false;
    } finally {
      refreshingRef.current = false;
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (accessToken) {
      getCurrentUser();
    }
    // Don't set loading=false here — the mount effect handles the "no token" case
  }, [accessToken]);

  // Periodic token validation
  useEffect(() => {
    if (!accessToken) return;

    const validateTokenPeriodically = () => {
      if (!isTokenValid()) {
        logout();
        window.location.href = '/sign-in';
      }
    };

    // Check token validity every 5 minutes
    const interval = setInterval(validateTokenPeriodically, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [accessToken]);

  // Add axios response interceptor to handle 401 errors globally
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        // Only retry once, and skip refresh-token endpoint itself
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('refresh-token')) {
          originalRequest._retry = true;
          const refreshed = await handleTokenRefresh();
          if (refreshed) {
            originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
            return axios.request(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]);

  // Check if token is valid
  const isTokenValid = () => {
    if (!accessToken) return false;
    
    try {
      // Decode token to check expiration
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const isValid = payload.exp > currentTime;
      
      // If token is invalid, clear it and redirect to login
      if (!isValid) {
        logout();
        window.location.href = '/sign-in';
      }
      
      return isValid;
    } catch (error) {
      console.error('Error validating token:', error);
      logout();
      window.location.href = '/sign-in';
      return false;
    }
  };

  const value = {
    user,
    loading,
    accessToken,
    refreshToken,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!accessToken && isTokenValid(),
    getCurrentUser,
    isTokenValid,
    handleTokenRefresh
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};