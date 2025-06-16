// client/src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Bienvenue sur la Plateforme de Gestion de Projets</h2>
      <p>Organisez et suivez vos projets efficacement.</p>
      <p>
        <Link to="/projets" className="button-link">Voir mes projets</Link>
      </p>
    </div>
  );
}

export default HomePage;