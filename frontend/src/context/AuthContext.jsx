
import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier la session existante au démarrage
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Aucun token : aucune session à vérifier
        if (!authService.isAuthenticated()) {
          return;
        }

        // Vérifier le token auprès du backend
        const currentUser = await authService.getProfile();

        setUser(currentUser);

        localStorage.setItem(
          'auth_user',
          JSON.stringify(currentUser)
        );

      } catch (error) {
        // Supprimer la session uniquement si le token est invalide
        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          await authService.logout();
          setUser(null);
        }

        console.error(
          'Erreur lors de la vérification de session :',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // Connexion de l'administrateur
  const login = async (email, password) => {
    const result = await authService.login(email, password);

    setUser(result.user);

    return result;
  };

  // Déconnexion de l'administrateur
  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour accéder au contexte
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};
