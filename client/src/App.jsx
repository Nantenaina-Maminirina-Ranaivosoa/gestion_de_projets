// client/src/App.jsx
import React, { useContext } from "react"; // Ajout useContext
import { Routes, Route, Navigate } from "react-router-dom"; // Ajout Navigate
import { Link } from "react-router-dom"; // Pour le lien de retour à l'accueil
import "./App.css";
import Header from "./components/Header";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"; // Importer RegisterPage

// import RegisterPage from './pages/RegisterPage'; 
import ProtectedRoute from "./components/ProtectedRoute"; // Importer ProtectedRoute
import AuthContext from "./context/AuthContext"; // Importer AuthContext

// Importer react-toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Le CSS de base

function App() {
  const appTitle = "Plateforme de Gestion de Projets";
  const { isAuthenticated, isLoading: isLoadingAuth } = useContext(AuthContext); // Pour la redirection de /connexion

  return (
    <div className="App">
      <Header title={appTitle} />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Rediriger vers /projets si l'utilisateur est déjà connecté et essaie d'aller sur /connexion */}
          <Route
            path="/connexion"
            element={
              isLoadingAuth ? (
                <div>Chargement...</div>
              ) : !isAuthenticated ? (
                <LoginPage />
              ) : (
                <Navigate to="/projets" replace />
              )
            }
          />
          <Route
            path="/inscription"
            element={
              // Protéger aussi la page d'inscription si l'utilisateur est déjà connecté
              isLoadingAuth ? (
                <div>Chargement...</div>
              ) : !isAuthenticated ? (
                <RegisterPage />
              ) : (
                <Navigate to="/projets" replace />
              )
            }
          />

          {/* <Route path="/inscription" element={<RegisterPage />} /> */}

          {/* Routes Protégées */}
          <Route
            path="/projets"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projets/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <div>
                <h2>404 - Page Non Trouvée</h2>
                <Link to="/">Retour à l'accueil</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Ma Super Application de Projets</p>
      </footer>
      {/* Conteneur pour les notifications toast */}
      <ToastContainer
        position="top-right" // Position des notifications
        autoClose={5000} // Fermeture automatique après 5 secondes
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light" // Ou "dark", ou "colored"
      />
    </div>
  );
}

export default App;
