import { SERVER_URL } from '../Utils/Constants';

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Initialize push notifications
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');

      // Check if notifications are permitted
      if (Notification.permission === 'denied') {
        console.warn('Push notifications are blocked');
        return false;
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Push notification permission denied');
          return false;
        }
      }

      // Get VAPID public key
      const response = await fetch(`${SERVER_URL}/api/notifications/vapid-key`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get VAPID key');
      }

      const { data } = await response.json();
      const vapidPublicKey = data.publicKey;

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      console.log('Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Send subscription to server
   * @param {PushSubscription} subscription - Push subscription
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ subscription })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        
        // Notify server
        await fetch(`${SERVER_URL}/api/notifications/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ 
            endpoint: this.subscription.endpoint 
          })
        });

        this.subscription = null;
        console.log('Unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }

  /**
   * Test push notification
   */
  async testNotification() {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        console.log('Test notification sent');
        return true;
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  /**
   * Show local notification
   * @param {Object} options - Notification options
   */
  showNotification(options) {
    if (!this.registration) {
      console.warn('Service worker not registered');
      return;
    }

    const notificationOptions = {
      body: options.body || 'You have a new notification',
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/badge-72x72.png',
      data: options.data || {},
      actions: options.actions || [],
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      vibrate: options.vibrate || [200, 100, 200],
      tag: options.tag || 'default',
      renotify: options.renotify || false
    };

    this.registration.showNotification(
      options.title || 'Eazy Event',
      notificationOptions
    );
  }

  /**
   * Handle notification click
   * @param {Function} callback - Click handler callback
   */
  onNotificationClick(callback) {
    if (this.registration) {
      this.registration.addEventListener('notificationclick', callback);
    }
  }

  /**
   * Handle notification close
   * @param {Function} callback - Close handler callback
   */
  onNotificationClose(callback) {
    if (this.registration) {
      this.registration.addEventListener('notificationclose', callback);
    }
  }

  /**
   * Check if notifications are supported
   * @returns {boolean} Support status
   */
  isNotificationSupported() {
    return this.isSupported;
  }

  /**
   * Check if user is subscribed
   * @returns {boolean} Subscription status
   */
  isSubscribed() {
    return this.subscription !== null;
  }

  /**
   * Get subscription info
   * @returns {Object|null} Subscription info
   */
  getSubscriptionInfo() {
    if (!this.subscription) return null;

    return {
      endpoint: this.subscription.endpoint,
      keys: this.subscription.getKey ? {
        p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')),
        auth: this.arrayBufferToBase64(this.subscription.getKey('auth'))
      } : null
    };
  }

  /**
   * Convert VAPID key to Uint8Array
   * @param {String} base64String - Base64 encoded key
   * @returns {Uint8Array} Decoded key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to Base64
   * @param {ArrayBuffer} buffer - Array buffer
   * @returns {String} Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Send event notification
   * @param {String} eventId - Event ID
   * @param {String} type - Notification type
   * @param {Object} data - Notification data
   */
  async sendEventNotification(eventId, type, data) {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications/event/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ type, ...data })
      });

      if (response.ok) {
        console.log('Event notification sent successfully');
        return true;
      } else {
        throw new Error('Failed to send event notification');
      }
    } catch (error) {
      console.error('Failed to send event notification:', error);
      return false;
    }
  }

  /**
   * Send chat notification
   * @param {String} roomId - Chat room ID
   * @param {String} message - Message content
   * @param {Array} recipientIds - Recipient user IDs
   */
  async sendChatNotification(roomId, message, recipientIds) {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications/chat/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ message, recipientIds })
      });

      if (response.ok) {
        console.log('Chat notification sent successfully');
        return true;
      } else {
        throw new Error('Failed to send chat notification');
      }
    } catch (error) {
      console.error('Failed to send chat notification:', error);
      return false;
    }
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;