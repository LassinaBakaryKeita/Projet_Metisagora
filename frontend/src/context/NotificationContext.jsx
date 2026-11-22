
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import { notificationService } from '../services/notificationService';


const NotificationContext = createContext(null);


export const NotificationProvider = ({ children }) => {

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);


  // Récupération des vrais compteurs depuis FastAPI
  const refreshCount = useCallback(async () => {
    try {
      const [unread, pending] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getUnresolvedCount()
      ]);

      setUnreadCount(unread);
      setPendingCount(pending);

    } catch (error) {
      console.error(
        'Erreur lors de la récupération des compteurs :',
        error
      );
    }
  }, []);


  useEffect(() => {

    refreshCount();

    // Synchronisation après chaque modification
    const handleUpdate = () => {
      refreshCount();
    };

    window.addEventListener(
      'notifications_updated',
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        'notifications_updated',
        handleUpdate
      );
    };

  }, [refreshCount]);


  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        pendingCount,
        refreshCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};


export const useNotifications = () => {

  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }

  return context;
};
