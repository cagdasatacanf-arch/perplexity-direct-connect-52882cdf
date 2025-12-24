import { useState, useEffect, useCallback } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.log('Notifications not available or not permitted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const sendPriceAlert = useCallback((
    symbolId: string,
    condition: 'above' | 'below',
    targetPrice: number,
    currentPrice: number
  ) => {
    const direction = condition === 'above' ? '📈' : '📉';
    const conditionText = condition === 'above' ? 'risen above' : 'fallen below';
    
    return sendNotification(
      `${direction} ${symbolId} Price Alert`,
      {
        body: `${symbolId} has ${conditionText} $${targetPrice.toFixed(2)}!\nCurrent price: $${currentPrice.toFixed(2)}`,
        tag: `price-alert-${symbolId}-${targetPrice}`,
        requireInteraction: true,
      }
    );
  }, [sendNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    sendPriceAlert,
  };
};
