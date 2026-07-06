import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Settings, 
  TestTube, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';
import pushNotificationService from '../../services/pushNotificationService';

const PushNotificationSettings = ({ onClose }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if notifications are supported
      const supported = pushNotificationService.isNotificationSupported();
      setIsSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      // Check current permission status
      setPermission(Notification.permission);

      // Initialize push notifications
      const initialized = await pushNotificationService.initialize();
      setIsSubscribed(initialized);

      // Set up notification click handler
      pushNotificationService.onNotificationClick((event) => {
        // Handle notification click
        if (event.notification.data && event.notification.data.url) {
          window.open(event.notification.data.url, '_blank');
        }
      });

    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      setError('Failed to initialize push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await pushNotificationService.initialize();
      if (success) {
        setIsSubscribed(true);
        setPermission(Notification.permission);
        setSuccess('Successfully subscribed to push notifications!');
      } else {
        setError('Failed to subscribe to push notifications');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      setError('Failed to subscribe to push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
      setSuccess('Successfully unsubscribed from push notifications');
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      setError('Failed to unsubscribe from push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setIsTesting(true);
      setError(null);

      const success = await pushNotificationService.testNotification();
      if (success) {
        setSuccess('Test notification sent! Check your notifications.');
      } else {
        setError('Failed to send test notification');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setError('Failed to send test notification');
    } finally {
      setIsTesting(false);
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { status: 'Granted', color: 'text-green-600', icon: CheckCircle };
      case 'denied':
        return { status: 'Denied', color: 'text-red-600', icon: XCircle };
      case 'default':
        return { status: 'Not Set', color: 'text-yellow-600', icon: AlertCircle };
      default:
        return { status: 'Unknown', color: 'text-gray-600', icon: AlertCircle };
    }
  };

  const getSupportStatus = () => {
    if (!isSupported) {
      return { status: 'Not Supported', color: 'text-red-600', icon: WifiOff };
    }
    return { status: 'Supported', color: 'text-green-600', icon: Wifi };
  };

  const permissionStatus = getPermissionStatus();
  const supportStatus = getSupportStatus();
  const PermissionIcon = permissionStatus.icon;
  const SupportIcon = supportStatus.icon;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
        <Card className="p-8 my-8">
          <LoadingSpinner />
          <p className="mt-4 text-center">Loading notification settings...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Push Notifications</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={XCircle}
            >
              Close
            </Button>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Browser Support */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <SupportIcon className="w-5 h-5" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Browser Support</h3>
              </div>
              <p className={`text-sm ${supportStatus.color}`}>
                {supportStatus.status}
              </p>
              {!isSupported && (
                <p className="text-xs text-gray-500 mt-1">
                  Your browser doesn't support push notifications
                </p>
              )}
            </div>

            {/* Permission Status */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <PermissionIcon className="w-5 h-5" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Permission</h3>
              </div>
              <p className={`text-sm ${permissionStatus.color}`}>
                {permissionStatus.status}
              </p>
              {permission === 'denied' && (
                <p className="text-xs text-gray-500 mt-1">
                  Please enable notifications in your browser settings
                </p>
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Subscription Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Subscription Status</h3>
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700">Subscribed to push notifications</span>
                </>
              ) : (
                <>
                  <BellOff className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Not subscribed to push notifications</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {!isSupported ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800">Not Supported</h4>
                </div>
                <p className="text-yellow-700 text-sm">
                  Push notifications are not supported in your browser. 
                  Please use a modern browser like Chrome, Firefox, or Safari.
                </p>
              </div>
            ) : permission === 'denied' ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-800">Notifications Blocked</h4>
                </div>
                <p className="text-red-700 text-sm mb-3">
                  Push notifications are blocked in your browser. To enable them:
                </p>
                <ol className="text-red-700 text-sm list-decimal list-inside space-y-1">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Select "Allow" for notifications</li>
                  <li>Refresh this page and try again</li>
                </ol>
              </div>
            ) : isSubscribed ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleUnsubscribe}
                  loading={isLoading}
                  icon={BellOff}
                >
                  Unsubscribe
                </Button>
                <Button
                  variant="primary"
                  onClick={handleTestNotification}
                  loading={isTesting}
                  icon={TestTube}
                >
                  Test Notification
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubscribe}
                loading={isLoading}
                icon={Bell}
              >
                Subscribe to Notifications
              </Button>
            )}
          </div>

          {/* Information */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">About Push Notifications</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Get notified about new events and updates</li>
              <li>• Receive chat messages from event participants</li>
              <li>• Stay updated with event reminders and changes</li>
              <li>• You can unsubscribe at any time</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PushNotificationSettings;
