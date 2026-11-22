
import api from './api';

// Extraction d'un message d'erreur compréhensible
const handleApiError = (error) => {
  const detail = error.response?.data?.detail;

  let message = 'Une erreur est survenue. Veuillez réessayer.';

  if (typeof detail === 'string') {
    message = detail;
  } else if (Array.isArray(detail)) {
    message = detail
      .map((item) => item.msg || 'Donnée invalide')
      .join(', ');
  } else if (error.response?.status === 404) {
    message = 'Cette notification est introuvable.';
  } else if (error.response?.status === 401) {
    message = 'Votre session a expiré. Veuillez vous reconnecter.';
  } else if (error.code === 'ECONNABORTED') {
    message = 'Le serveur met trop de temps à répondre.';
  } else if (!error.response) {
    message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  }

  return new Error(message);
};


// Conversion d'une date en temps relatif
const formatRelativeTime = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue';
  }

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSeconds < 60) {
    return 'À l’instant';
  }

  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `Il y a ${minutes} min`;
  }

  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `Il y a ${hours} h`;
  }

  const days = Math.floor(diffSeconds / 86400);

  if (days === 1) return 'Hier';

  if (days < 7) {
    return `Il y a ${days} jours`;
  }

  return date.toLocaleDateString('fr-FR');
};


// Formatage de la date complète
const formatDate = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue';
  }

  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};


// Conversion Backend (snake_case) -> Frontend (camelCase)
const mapNotification = (notification) => {
  return {
    id: notification.id,
    customerPhone: notification.customer_phone,
    customerName: notification.customer_name || 'Client inconnu',
    message: notification.message,
    reason: notification.reason,
    status: notification.status,
    isRead: notification.is_read,
    priority: notification.priority,
    timestamp: formatRelativeTime(notification.created_at),
    date: formatDate(notification.created_at),
    createdAt: notification.created_at,
  };
};


// Événement permettant de synchroniser les compteurs
const dispatchNotificationUpdate = () => {
  window.dispatchEvent(new Event('notifications_updated'));
};


export const notificationService = {

  // GET /api/v1/notifications
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');

      return response.data.items.map(mapNotification);
    } catch (error) {
      throw handleApiError(error);
    }
  },


  // GET /api/v1/notifications/unresolved-count
  getUnresolvedCount: async () => {
    try {
      const response = await api.get('/notifications/unresolved-count');

      return response.data.count;
    } catch (error) {
      throw handleApiError(error);
    }
  },


  // GET /api/v1/notifications/unread-count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');

      return response.data.count;
    } catch (error) {
      throw handleApiError(error);
    }
  },


  // POST /api/v1/notifications
  createNotification: async (notificationData) => {
    try {
      const response = await api.post('/notifications', {
        customer_phone: notificationData.customerPhone,
        customer_name: notificationData.customerName || null,
        message: notificationData.message,
        reason: notificationData.reason,
        priority: notificationData.priority || 'medium',
      });

      dispatchNotificationUpdate();

      return mapNotification(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },


  // PATCH /api/v1/notifications/:id/read
  markAsRead: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);

      dispatchNotificationUpdate();

      return mapNotification(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },


  // PATCH /api/v1/notifications/:id/resolve
  resolveNotification: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/resolve`);

      dispatchNotificationUpdate();

      return mapNotification(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },


  // PATCH /api/v1/notifications/:id/reopen
  reopenNotification: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/reopen`);

      dispatchNotificationUpdate();

      return mapNotification(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
