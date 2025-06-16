// client/src/components/Header.jsx
import React, { useContext } from 'react'; // Importer useContext
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext'; // Importer AuthContext
import './Header.css';

function Header(props) {
  const { isAuthenticated, logout, utilisateur } = useContext(AuthContext); // Utiliser le contexte
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Appeler la fonction logout du contexte
    navigate('/connexion'); // Rediriger vers la page de connexion après déconnexion
  };

  return (
    <header className="app-header">
      <h1>
        <Link to="/" className="header-title-link">{props.title}</Link>
      </h1>
      <nav>
        <Link to="/">Accueil</Link>
        {isAuthenticated && <Link to="/projets">Projets</Link>} {/* Afficher seulement si connecté */}

        {isAuthenticated ? (
          <>
            <span className="user-greeting">Bonjour, {utilisateur?.nom || 'Utilisateur'}!</span>
            <button onClick={handleLogout} className="logout-button">Déconnexion</button>
          </>
        ) : (
          <>
            <Link to="/connexion">Connexion</Link>
            <Link to="/inscription">Inscription</Link> {/* Lien ajouté ici */}
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;