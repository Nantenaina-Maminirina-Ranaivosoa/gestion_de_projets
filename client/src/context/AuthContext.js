// client/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token')); // Charger le token depuis localStorage au démarrage
  const [utilisateur, setUtilisateur] = useState(null); // Informations de l'utilisateur connecté
  const [isLoading, setIsLoading] = useState(true); // Pour gérer le chargement initial de l'utilisateur

  useEffect(() => {
    // Si un token existe, essayer de récupérer les infos utilisateur (ou décoder le token)
    // Pour une application plus robuste, vous feriez un appel API /api/utilisateurs/moi avec le token
    // pour valider le token et obtenir des données utilisateur fraîches.
    // Pour l'instant, on peut stocker les infos utilisateur au login.
    const storedUser = localStorage.getItem('utilisateur');
    if (token && storedUser) {
      try {
        setUtilisateur(JSON.parse(storedUser));
      } catch (e) {
        console.error("Erreur parsing utilisateur depuis localStorage", e);
        // Token invalide ou données utilisateur corrompues, déconnecter
        logout();
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('utilisateur', JSON.stringify(userData)); // Stocker les infos utilisateur
    setToken(newToken);
    setUtilisateur(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('utilisateur');
    setToken(null);
    setUtilisateur(null);
    // Redirection gérée au niveau du composant qui appelle logout ou via un effet
  };

  return (
    <AuthContext.Provider value={{ token, utilisateur, login, logout, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;