// client/src/components/ProjectList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './ProjectList.css';

// Ajout de la prop 'onDeleteProject'
function ProjectList({ projects, onDeleteProject, onEditProject }) {
  if (!projects || projects.length === 0) {
    return <p>Aucun projet à afficher pour le moment.</p>;
  }

  return (
    <div className="project-list-items-container">
      <ul>
        {projects.map(project => (
          <li key={project.id} className="project-item">
            <div className="project-item-content">
              <Link to={`/projets/${project.id}`} className="project-link">
                <h3>{project.nom_projet}</h3>
                <p>{project.description || 'Pas de description.'}</p>
                <small>Créé le: {new Date(project.date_creation).toLocaleDateString()}</small>
              </Link>
            </div>
            <div className="project-item-actions">
              <button
                onClick={() => onEditProject(project)} // Passer l'objet projet entier
                className="button-edit-project"
              >
                Modifier
              </button>
              <button 
                onClick={() => onDeleteProject(project.id)} 
                className="button-delete-project"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectList;