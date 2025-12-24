import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';

export interface PriceAlert {
  id: string;
  symbolId: string;
  symbolName: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
  triggered?: boolean;
}

const STORAGE_KEY = 'price-alerts';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const { sendPriceAlert, requestPermission, permission, isSupported } = useNotifications();

  // Load alerts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAlerts(JSON.parse(stored));
      } catch {
        setAlerts([]);
      }
    }
  }, []);

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  // Request notification permission when first alert is added
  useEffect(() => {
    if (alerts.length > 0 && isSupported && permission === 'default') {
      requestPermission();
    }
  }, [alerts.length, isSupported, permission, requestPermission]);

  const addAlert = useCallback((alert: Omit<PriceAlert, 'id' | 'createdAt'>) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setAlerts(prev => [...prev, newAlert]);
    
    // Request permission if not already granted
    if (isSupported && permission !== 'granted') {
      requestPermission();
    }
    
    return newAlert;
  }, [isSupported, permission, requestPermission]);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const triggerAlert = useCallback((id: string, currentPrice?: number) => {
    setAlerts(prev => {
      const alert = prev.find(a => a.id === id);
      if (alert && currentPrice !== undefined) {
        // Send browser notification
        sendPriceAlert(alert.symbolId, alert.condition, alert.targetPrice, currentPrice);
      }
      return prev.map(a => 
        a.id === id ? { ...a, triggered: true } : a
      );
    });
  }, [sendPriceAlert]);

  const clearTriggered = useCallback(() => {
    setAlerts(prev => prev.filter(alert => !alert.triggered));
  }, []);

  const getAlertsForSymbol = useCallback((symbolId: string) => {
    return alerts.filter(alert => alert.symbolId === symbolId && !alert.triggered);
  }, [alerts]);

  const checkAlerts = useCallback((symbolId: string, currentPrice: number) => {
    const symbolAlerts = alerts.filter(
      alert => alert.symbolId === symbolId && !alert.triggered
    );
    
    const triggered: PriceAlert[] = [];
    
    symbolAlerts.forEach(alert => {
      if (
        (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && currentPrice <= alert.targetPrice)
      ) {
        triggered.push(alert);
      }
    });
    
    return triggered;
  }, [alerts]);

  return {
    alerts: alerts.filter(a => !a.triggered),
    triggeredAlerts: alerts.filter(a => a.triggered),
    addAlert,
    removeAlert,
    triggerAlert,
    clearTriggered,
    getAlertsForSymbol,
    checkAlerts,
    notificationPermission: permission,
    requestNotificationPermission: requestPermission,
  };
};
