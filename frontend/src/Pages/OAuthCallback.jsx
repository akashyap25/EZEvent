import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../Components/LoadingSpinner';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(getErrorMessage(errorParam));
        setTimeout(() => navigate('/sign-in'), 3000);
        return;
      }

      if (accessToken && refreshToken) {
        try {
          // Store tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          // Update auth context
          await login(accessToken);
          
          // Redirect to home or intended destination
          const redirectTo = localStorage.getItem('authRedirect') || '/';
          localStorage.removeItem('authRedirect');
          navigate(redirectTo);
        } catch (err) {
          console.error('OAuth callback error:', err);
          setError('Failed to complete authentication. Please try again.');
          setTimeout(() => navigate('/sign-in'), 3000);
        }
      } else {
        setError('Invalid authentication response. Please try again.');
        setTimeout(() => navigate('/sign-in'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth_failed': 'Authentication failed. Please try again.',
      'google_auth_failed': 'Google authentication failed. Please try again.',
      'github_auth_failed': 'GitHub authentication failed. Please try again.',
      'access_denied': 'Access was denied. Please try again.',
      'invalid_state': 'Invalid state parameter. Please try again.',
    };
    return errorMessages[errorCode] || 'An error occurred during authentication.';
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to sign in page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
        <LoadingSpinner />
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Completing Sign In</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Please wait while we verify your credentials...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
