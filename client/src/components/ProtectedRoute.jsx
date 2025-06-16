// client/src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation(); // Pour mémoriser la page d'où vient l'utilisateur

  if (isLoading) {
    // Afficher un spinner de chargement ou un message pendant que l'état d'authentification est vérifié
    // Surtout pertinent si vous avez une logique de vérification de token asynchrone au démarrage
    return <div>Chargement de l'authentification...</div>; 
  }

  if (!isAuthenticated) {
    // Si l'utilisateur n'est pas authentifié, redirigez-le vers la page de connexion.
    // `replace` évite d'ajouter la page protégée à l'historique de navigation.
    // `state={{ from: location }}` permet de rediriger l'utilisateur vers la page
    // qu'il essayait d'atteindre après s'être connecté.
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  // Si l'utilisateur est authentifié, affichez le composant enfant (la page protégée).
  return children;
};

export default ProtectedRoute;