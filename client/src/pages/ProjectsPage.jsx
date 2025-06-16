// client/src/pages/ProjectsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from "react-toastify"; // Importer ToastContainer
import "react-toastify/dist/ReactToastify.css";

import ProjectList from '../components/ProjectList';
import Modal from '../components/Modal';
import { authenticatedFetch } from '../services/apiService';
import AuthContext from '../context/AuthContext';
import './PageStyles.css';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Chargement global
  const [error, setError] = useState(null); // Erreur globale

  // États pour le formulaire d'AJOUT de projet
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isSubmittingAddProject, setIsSubmittingAddProject] = useState(false);
  const [addProjectFormErrors, setAddProjectFormErrors] = useState({});
  const [isAddProjectFormValid, setIsAddProjectFormValid] = useState(false); // Initialement invalide

  const { isAuthenticated } = useContext(AuthContext);
  const [deleteError, setDeleteError] = useState(null); // Gérer via toast ? Pour l'instant on garde si besoin spécifique.

  // États pour l'ÉDITION de projet (modal)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editProjectFormErrors, setEditProjectFormErrors] = useState({});
  const [isEditProjectFormValid, setIsEditProjectFormValid] = useState(false); // Initialement invalide (ou vrai si pré-rempli)

  // --- Fonctions de Validation ---

  /**
   * Valide un champ (soit pour l'ajout, soit pour l'édition).
   * @param {string} value - La valeur du nom du projet.
   * @returns {string} - Le message d'erreur ou une chaîne vide.
   */
  const validateProjectName = (value) => {
    if (!value.trim()) return 'Le nom du projet est requis.';
    if (value.trim().length < 3) return 'Le nom du projet doit faire au moins 3 caractères.';
    return '';
  };

  // --- Logique pour l'AJOUT de projet ---

  const handleAddProjectInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'newProjectNameInput') {
      setNewProjectName(value);
      const errorMsg = validateProjectName(value);
      setAddProjectFormErrors(prev => ({ ...prev, newProjectName: errorMsg }));
    } else if (name === 'newProjectDescriptionInput') {
      setNewProjectDescription(value);
    }
  };

  // Met à jour la validité du formulaire d'ajout
  useEffect(() => {
    const errorMsg = validateProjectName(newProjectName);
    setIsAddProjectFormValid(!errorMsg); // Valide s'il n'y a pas d'erreur
  }, [newProjectName]);


  const handleAddProjectSubmit = async (event) => {
    event.preventDefault();

    const errorMsg = validateProjectName(newProjectName);
    if (errorMsg) {
      setAddProjectFormErrors({ newProjectName: errorMsg });
      toast.error("Veuillez corriger les erreurs avant d'ajouter.");
      return;
    }

    setIsSubmittingAddProject(true);

    const projectData = {
      nom_projet: newProjectName.trim(),
      description: newProjectDescription.trim(),
    };

    try {
      const createdProjectResponse = await authenticatedFetch(
        "http://localhost:3000/api/projets",
        {
          method: "POST",
          body: JSON.stringify(projectData),
        }
      );
      setProjects((prev) => [...prev, createdProjectResponse.projet]);
      toast.success("Projet ajouté avec succès !");
      setNewProjectName("");
      setNewProjectDescription("");
      setAddProjectFormErrors({}); // Réinitialiser les erreurs
      setIsAddProjectFormValid(false); // Réinitialiser la validité
    } catch (e) {
      toast.error("Erreur d'ajout : " + (e.message || "Erreur inconnue"));
    } finally {
      setIsSubmittingAddProject(false);
    }
  };

  // --- Logique pour l'ÉDITION de projet ---

  const handleEditProjectInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'editProjectNameInput') {
      setEditProjectName(value);
      const errorMsg = validateProjectName(value);
      setEditProjectFormErrors(prev => ({ ...prev, editProjectName: errorMsg }));
    } else if (name === 'editProjectDescriptionInput') {
      setEditProjectDescription(value);
    }
  };

    // Met à jour la validité du formulaire d'édition
    useEffect(() => {
        if (isEditModalOpen) {
            const errorMsg = validateProjectName(editProjectName);
            setIsEditProjectFormValid(!errorMsg); // Valide s'il n'y a pas d'erreur
        }
    }, [editProjectName, isEditModalOpen]);


  const handleOpenEditModal = (project) => {
    setEditingProject(project);
    setEditProjectName(project.nom_projet);
    setEditProjectDescription(project.description || "");
    setEditProjectFormErrors({}); // Réinitialiser les erreurs
    setIsEditProjectFormValid(true); // Le formulaire est initialement valide car pré-rempli
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProject(null);
    setEditProjectFormErrors({});
  };

  const handleUpdateProjectSubmit = async (event) => {
    event.preventDefault();

    const errorMsg = validateProjectName(editProjectName);
     if (errorMsg) {
       setEditProjectFormErrors({ editProjectName: errorMsg });
       toast.error("Veuillez corriger les erreurs avant de sauvegarder.");
       return;
     }

    if (!editingProject) return;
    setIsUpdating(true);

    const updatedProjectData = {
      nom_projet: editProjectName.trim(),
      description: editProjectDescription.trim(),
    };

    try {
      await authenticatedFetch(
        `http://localhost:3000/api/projets/${editingProject.id}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedProjectData),
        }
      );

      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id ? { ...p, ...updatedProjectData, id: p.id } : p // Conserver l'ID
        )
      );
      toast.success("Projet mis à jour !");
      handleCloseEditModal();
    } catch (e) {
      toast.error("Erreur de mise à jour : " + (e.message || "Erreur inconnue"));
    } finally{
      setIsUpdating(false);
    }
  };

  // --- Logique Générale (Fetch, Delete) ---

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authenticatedFetch("http://localhost:3000/api/projets");
      setProjects(data.projets || []);
    } catch (e) {
      setError(e.message + (e.status ? ` (Status: ${e.status})` : ''));
      toast.error("Erreur de chargement : " + (e.message || "Erreur inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    } else {
      setProjects([]);
    }
  }, [isAuthenticated]);

  const handleDeleteProject = async (projectIdToDelete) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet et toutes ses tâches associées ?")) {
      // Pas besoin de setIsLoading(true) ici si on veut une suppression plus fluide,
      // mais on peut le garder pour un retour visuel.
      try {
        await authenticatedFetch(
          `http://localhost:3000/api/projets/${projectIdToDelete}`,
          { method: "DELETE" }
        );
        setProjects((prev) => prev.filter((p) => p.id !== projectIdToDelete));
        toast.success("Projet supprimé avec succès !");
      } catch (e) {
        toast.error("Erreur de suppression : " + (e.message || "Erreur inconnue"));
        setDeleteError(e.message); // On peut aussi garder l'erreur d'état si nécessaire
      }
    }
  };

  // --- Rendu du Composant ---

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="page-container">
        <p>
          Veuillez vous <Link to="/connexion">connecter</Link> pour voir et gérer les projets.
        </p>
        <ToastContainer />
      </div>
    );
  }

  if (isLoading && projects.length === 0)
    return (
      <div className="page-container">
        <p>Chargement des projets...</p>
        <ToastContainer />
      </div>
    );

    if (error) return <div className="page-container error-message"><p>Erreur de chargement des projets: {error}</p><ToastContainer /></div>;


  return (
    <div className="page-container projects-page-layout">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
       {deleteError && <p className="error-message" style={{marginBottom: '15px'}}>{deleteError}</p>}

      {isAuthenticated && (
        <div className="add-project-form-container">
          <h3>Ajouter un Nouveau Projet</h3>
          <form onSubmit={handleAddProjectSubmit} className="add-project-form-inline" noValidate>
            <div>
              <label htmlFor="newProjectNameInput">Nom Projet:</label>
              <input
                type="text"
                id="newProjectNameInput"
                name="newProjectNameInput" // Nom distinct
                value={newProjectName}
                onChange={handleAddProjectInputChange}
                required
                className={addProjectFormErrors.newProjectName ? 'input-error' : ''}
              />
               {addProjectFormErrors.newProjectName && <small className="field-error-message">{addProjectFormErrors.newProjectName}</small>}
            </div>
            <div>
              <label htmlFor="newProjectDescriptionInput">Description:</label>
              <textarea
                id="newProjectDescriptionInput"
                name="newProjectDescriptionInput" // Nom distinct
                value={newProjectDescription}
                onChange={handleAddProjectInputChange}
              />
              {/* Pas d'erreur affichée ici */}
            </div>
            {/* Bouton désactivé si soumission ou formulaire invalide */}
            <button type="submit" disabled={isSubmittingAddProject || !isAddProjectFormValid}>
              {isSubmittingAddProject ? 'Ajout...' : 'Ajouter Projet'}
            </button>
          </form>
        </div>
      )}

      <div className="project-list-main-container">
        <h2>Liste des Projets</h2>
        {isLoading && projects.length > 0 && <p>Mise à jour...</p>}
        <ProjectList
          projects={projects}
          onDeleteProject={handleDeleteProject}
          onEditProject={handleOpenEditModal}
        />
      </div>

      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Modifier le Projet">
        {editingProject && (
          <form onSubmit={handleUpdateProjectSubmit} className="edit-project-form" noValidate>
            <div>
              <label htmlFor="editProjectNameInput">Nom du Projet :</label>
              <input
                type="text"
                id="editProjectNameInput"
                name="editProjectNameInput" // Nom distinct
                value={editProjectName}
                onChange={handleEditProjectInputChange}
                required
                disabled={isUpdating}
                className={editProjectFormErrors.editProjectName ? 'input-error' : ''}
              />
               {editProjectFormErrors.editProjectName && <small className="field-error-message">{editProjectFormErrors.editProjectName}</small>}
            </div>
            <div>
              <label htmlFor="editProjectDescriptionInput">Description :</label>
              <textarea
                id="editProjectDescriptionInput"
                name="editProjectDescriptionInput" // Nom distinct
                value={editProjectDescription}
                onChange={handleEditProjectInputChange}
                disabled={isUpdating}
              />
            </div>
            <div className="form-actions">
              {/* Bouton désactivé si mise à jour ou formulaire invalide */}
              <button type="submit" disabled={isUpdating || !isEditProjectFormValid}>
                {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button type="button" onClick={handleCloseEditModal} disabled={isUpdating} className="button-secondary">
                Annuler
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ProjectsPage;