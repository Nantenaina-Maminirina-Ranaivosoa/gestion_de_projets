// client/src/pages/ProjectDetailPage.jsx
import React, { useState, useEffect, useContext } from 'react'; // Ajout useContext
import { useParams, Link } from 'react-router-dom';
import TaskList from '../components/TaskList';
import { authenticatedFetch } from '../services/apiService'; // Importer
import AuthContext from '../context/AuthContext'; // Importer AuthContext
import './PageStyles.css';

function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [errorProject, setErrorProject] = useState(null);
  const { token } = useContext(AuthContext);

 useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId || !token) { // Ne pas fetcher si pas de projectId ou pas de token
        if (!token) setProject(null); // Effacer le projet si déconnecté
        return;
      }
      setIsLoadingProject(true);
      setErrorProject(null);
      try {
        // Utiliser authenticatedFetch
        const data = await authenticatedFetch(`http://localhost:3000/api/projets/${projectId}`);
        setProject(data.projet);
      } catch (e) {
        console.error("Erreur lors de la récupération des détails du projet:", e);
        setErrorProject(e.message + (e.status ? ` (Status: ${e.status})` : ''));
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProjectDetails();
  }, [projectId, token]); // Redéclencher si projectId ou token change

  if (!token && !isLoadingProject) return (
    <div className="page-container">
        <p>Veuillez vous <Link to="/connexion">connecter</Link> pour voir les détails de ce projet.</p>
    </div>
  );

  if (isLoadingProject) return <div className="page-container"><p>Chargement du projet...</p></div>;
  if (errorProject) return <div className="page-container"><p>Erreur: {errorProject} <Link to="/projets">Retour aux projets</Link></p></div>;
  if (!project) return <div className="page-container"><p>Projet non trouvé. <Link to="/projets">Retour aux projets</Link></p></div>;

// Pour éviter un flash du composant TaskList si project est null brièvement
  if (!project) return null; 

  return (
    <div className="page-container project-detail-layout">
      {/* ... affichage des détails du projet ... */}
      <div className="project-header">
        <h2>{project.nom_projet}</h2>
        <p>{project.description || "Aucune description pour ce projet."}</p>
        <p>
            <small>Utilisateur ID: {project.utilisateur_id} - Créé le: {new Date(project.date_creation).toLocaleDateString()}</small>
        </p>
        <Link to="/projets" className="back-link" style={{marginTop: '10px', display: 'inline-block'}}>&larr; Retour à la liste des projets</Link>
      </div>

      <hr style={{margin: "20px 0"}}/>

      <TaskList projectId={projectId} /> 
    </div>
  );
}
export default ProjectDetailPage;

