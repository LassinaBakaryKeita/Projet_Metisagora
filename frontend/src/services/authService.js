
/**
 * Service d'authentification Métisagora
 * Communique avec le backend FastAPI.
 */

import api from './api';

export const authService = {

  // 1. Connexion de l'administrateur
  /*login: async (email, password) => {
    const response = await api.post('/admin/login', {
      email,
      password
    });

    const { access_token } = response.data;

    // Stocker le véritable JWT généré par FastAPI
    localStorage.setItem('auth_token', access_token);

    try {
      // Récupérer les informations du compte connecté
      const user = await authService.getProfile();

      localStorage.setItem('auth_user', JSON.stringify(user));

      return {
        token: access_token,
        user
      };

    } catch (error) {
      // Si la récupération du profil échoue,
      // ne pas conserver une session incomplète.
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      throw error;
    }
  },*/

  login: async (email, password) => {
    try {
      const response = await api.post('/admin/login', {
        email,
        password
      });

      const { access_token } = response.data;

      localStorage.setItem('auth_token', access_token);

      const user = await authService.getProfile();

      localStorage.setItem('auth_user', JSON.stringify(user));

      return { token: access_token, user };

    } catch (error) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      if (error.response?.status === 401) {
        throw new Error(
          "L'adresse email ou le mot de passe est incorrect. Veuillez vérifier vos informations et réessayer."
        );
      }

      if (!error.response) {
        throw new Error(
          "Impossible de contacter le serveur. Veuillez réessayer ultérieurement."
        );
      }

      throw new Error(
        "Une erreur est survenue. Veuillez réessayer."
      );
    }
  },

  // 2. Récupération du profil administrateur
  getProfile: async () => {
    const response = await api.get('/admin/me');
    return response.data;
  },

  // 3. Déconnexion
  logout: async () => {
    // Notre backend ne possède pas encore d'endpoint logout.
    // La déconnexion consiste donc à supprimer le JWT local.
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  // 4. Récupération du profil sauvegardé
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // 5. Vérification de la présence d'un token
  isAuthenticated: () => {
    return Boolean(localStorage.getItem('auth_token'));
  }
};
