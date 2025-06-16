// client/src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify'; // Importer toast

import '../pages/LoginPage.css'; // Ou un CSS spécifique pour LoginPage

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext); // Utiliser la fonction login du contexte

  // Tenter de rediriger vers la page d'où l'utilisateur vient après connexion
  const from = location.state?.from?.pathname || '/projets';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/utilisateurs/connexion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, mot_de_passe: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de connexion.');
      }

      // Connexion réussie, appeler la fonction login du contexte
      // data.token et data.utilisateur sont attendus de l'API
      if (data.token && data.utilisateur) {
        login(data.token, data.utilisateur);
        toast.success('Connexion réussie ! Bienvenue.'); // Notification de succès
        navigate(from, { replace: true }); // Rediriger vers la page d'origine ou /projets
      } else {
        throw new Error('Réponse de connexion invalide de la part du serveur.');
      }

    } catch (err) {
      toast.error(err.message || 'Une erreur est survenue lors de la connexion.'); // Notification d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container login-page">
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label htmlFor="email">Email :</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password">Mot de passe :</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
        <p style={{ marginTop: '15px' }}>
          Pas encore de compte ? <Link to="/inscription">Inscrivez-vous ici</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;