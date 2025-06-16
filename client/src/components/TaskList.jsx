// client/src/components/TaskList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { authenticatedFetch } from '../services/apiService';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './TaskList.css';

function TaskList({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Chargement de la liste des tâches
  const [error, setError] = useState(null); // Erreur de chargement de la liste
  const { token } = useContext(AuthContext);

  // --- États pour le formulaire d'AJOUT de tâche ---
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('à faire'); // Statut par défaut
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [addTaskFormErrors, setAddTaskFormErrors] = useState({});
  const [isAddTaskFormValid, setIsAddTaskFormValid] = useState(false);

  // --- États pour l'ÉDITION de tâche (formulaire inline) ---
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState('');
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [editTaskFormErrors, setEditTaskFormErrors] = useState({});
  const [isEditTaskFormValid, setIsEditTaskFormValid] = useState(false);
  
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const statutsAutorises = ['à faire', 'en cours', 'terminé'];

  // --- Validation Générique pour les champs de tâche ---
  const validateTaskField = (fieldName, value) => {
    let errorMsg = '';
    switch (fieldName) {
      case 'newTaskName': // Pour le formulaire d'ajout
      case 'editTaskName': // Pour le formulaire d'édition
        if (!value.trim()) errorMsg = 'Le nom de la tâche est requis.';
        else if (value.trim().length < 3) errorMsg = 'Le nom doit faire au moins 3 caractères.';
        break;
      case 'newTaskStatus': // Pour le formulaire d'ajout
      case 'editTaskStatus': // Pour le formulaire d'édition
        if (!value) errorMsg = 'Le statut est requis.';
        else if (!statutsAutorises.includes(value)) errorMsg = 'Statut invalide.';
        break;
      // La description est optionnelle, pas de validation d'erreur bloquante ici.
      default:
        break;
    }
    return errorMsg;
  };

  // --- Logique et Validation pour le formulaire d'AJOUT de tâche ---
  const validateAddTaskForm = () => {
    const errors = {};
    errors.newTaskName = validateTaskField('newTaskName', newTaskName);
    errors.newTaskStatus = validateTaskField('newTaskStatus', newTaskStatus);
    setAddTaskFormErrors(errors);
    return !Object.values(errors).some(msg => msg !== ''); // Valide si aucune erreur
  };

  useEffect(() => {
    setIsAddTaskFormValid(validateAddTaskForm());
  }, [newTaskName, newTaskStatus]); // Recalculer si nom ou statut changent

  const handleAddTaskInputChange = (e) => {
    const { name, value } = e.target;
    let errorMsg = '';

    if (name === 'newTaskNameInput') {
      setNewTaskName(value);
      errorMsg = validateTaskField('newTaskName', value);
      setAddTaskFormErrors(prev => ({ ...prev, newTaskName: errorMsg }));
    } else if (name === 'newTaskDescriptionInput') {
      setNewTaskDescription(value);
    } else if (name === 'newTaskStatusSelect') {
      setNewTaskStatus(value);
      errorMsg = validateTaskField('newTaskStatus', value);
      setAddTaskFormErrors(prev => ({ ...prev, newTaskStatus: errorMsg }));
    }
  };
  // --- Fin Validation pour AJOUT ---

  // --- Logique et Validation pour le formulaire d'ÉDITION de tâche ---
  const validateEditTaskForm = () => {
    const errors = {};
    errors.editTaskName = validateTaskField('editTaskName', editTaskName);
    errors.editTaskStatus = validateTaskField('editTaskStatus', editTaskStatus);
    setEditTaskFormErrors(errors);
    return !Object.values(errors).some(msg => msg !== '');
  };

  useEffect(() => {
    if (editingTaskId) { // Valider seulement si on est en mode édition
      setIsEditTaskFormValid(validateEditTaskForm());
    }
  }, [editTaskName, editTaskStatus, editingTaskId]); // Recalculer si ces champs ou l'ID d'édition changent

  const handleEditTaskInputChange = (e) => {
    const { name, value } = e.target;
    let errorMsg = '';

    if (name === `editTaskName-${editingTaskId}`) {
      setEditTaskName(value);
      errorMsg = validateTaskField('editTaskName', value);
      setEditTaskFormErrors(prev => ({ ...prev, editTaskName: errorMsg }));
    } else if (name === `editTaskDescription-${editingTaskId}`) {
      setEditTaskDescription(value);
    } else if (name === `editTaskStatus-${editingTaskId}`) {
      setEditTaskStatus(value);
      errorMsg = validateTaskField('editTaskStatus', value);
      setEditTaskFormErrors(prev => ({ ...prev, editTaskStatus: errorMsg }));
    }
  };
  // --- Fin Validation pour ÉDITION ---

  const fetchTasks = async () => {
    if (!projectId || !token) {
      setTasks([]);
      setIsLoading(false);
      setError(null); // Clear error if no project/token
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await authenticatedFetch(`http://localhost:3000/api/projets/${projectId}/taches`);
      setTasks(data.taches || []);
    } catch (e) {
      console.error(`Erreur lors de la récupération des tâches pour le projet ${projectId}:`, e);
      setError(e.message + (e.status ? ` (Status: ${e.status})` : ''));
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    setAddTaskFormErrors({}); // Réinitialiser les erreurs du formulaire d'ajout
    setNewTaskName(''); 
    setNewTaskDescription(''); 
    setNewTaskStatus('à faire');
    
    setEditTaskFormErrors({}); // Et celles du formulaire d'édition
    setEditingTaskId(null);   // Quitter le mode édition
    fetchTasks();
  }, [projectId, token]);

  const handleAddTaskSubmit = async (event) => {
    event.preventDefault();
    if (!validateAddTaskForm()) { // Utilise la fonction de validation complète
      toast.error("Veuillez corriger les erreurs dans le formulaire d'ajout de tâche.");
      return;
    }
    setIsSubmittingTask(true);
    const taskData = {
      nom_tache: newTaskName.trim(),
      description: newTaskDescription.trim(),
      statut: newTaskStatus,
    };

    try {
      const createdTaskResponse = await authenticatedFetch(
        `http://localhost:3000/api/projets/${projectId}/taches`,
        {
          method: 'POST',
          body: JSON.stringify(taskData),
        }
      );
      setTasks(prevTasks => [...prevTasks, createdTaskResponse.tache]);
      setNewTaskName('');
      setNewTaskDescription('');
      setNewTaskStatus('à faire');
      setAddTaskFormErrors({}); // Réinitialiser les erreurs après succès
      toast.success('Tâche ajoutée avec succès !');
    } catch (e) {
      toast.error(`Erreur ajout tâche: ${e.message}${e.status ? ` (Status: ${e.status})` : ''}`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditTaskName(task.nom_tache);
    setEditTaskDescription(task.description || '');
    setEditTaskStatus(task.statut);
    
    // Initialiser les erreurs et la validité pour le formulaire d'édition
    const initialErrors = { 
        editTaskName: validateTaskField('editTaskName', task.nom_tache),
        editTaskStatus: validateTaskField('editTaskStatus', task.statut)
    };
    setEditTaskFormErrors(initialErrors);
    setIsEditTaskFormValid(!Object.values(initialErrors).some(msg => msg !== ''));
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTaskFormErrors({}); // Aussi réinitialiser les erreurs d'édition en annulant
  };

  const handleUpdateTaskSubmit = async (event) => {
    event.preventDefault();
    if (!validateEditTaskForm()) { // Utilise la fonction de validation complète
      toast.error("Veuillez corriger les erreurs dans le formulaire de modification de tâche.");
      return;
    }
    if (!editingTaskId) return;

    setIsUpdatingTask(true);
    const updatedTaskData = {
      nom_tache: editTaskName.trim(),
      description: editTaskDescription.trim(),
      statut: editTaskStatus,
    };

    try {
      await authenticatedFetch(
        `http://localhost:3000/api/taches/${editingTaskId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updatedTaskData),
        }
      );
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === editingTaskId ? { ...task, ...updatedTaskData } : task
        )
      );
      setEditingTaskId(null);
      setEditTaskFormErrors({}); // Réinitialiser les erreurs après succès
      toast.success('Tâche mise à jour avec succès !');
    } catch (e) {
      console.error("Erreur lors de la mise à jour de la tâche:", e);
      toast.error(`Erreur mise à jour: ${e.message}${e.status ? ` (Status: ${e.status})` : ''}`);
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleDeleteTask = async (taskIdToDelete) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      setDeletingTaskId(taskIdToDelete);
      try {
        await authenticatedFetch(
          `http://localhost:3000/api/taches/${taskIdToDelete}`,
          { method: 'DELETE' }
        );
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskIdToDelete));
        if (editingTaskId === taskIdToDelete) {
          setEditingTaskId(null);
        }
        toast.success('Tâche supprimée avec succès !');
      } catch (e) {
        console.error("Erreur lors de la suppression de la tâche:", e);
        toast.error(`Erreur suppression tâche: ${e.message}${e.status ? ` (Status: ${e.status})` : ''}`);
      } finally {
        setDeletingTaskId(null);
      }
    }
  };

  if (!projectId) return null;
  if (isLoading) return <div className="task-list-container"><p>Chargement des tâches...</p></div>;
  if (error && !tasks.length) return <div className="task-list-container error-message"><p>Erreur chargement tâches: {error}</p></div>; // Afficher l'erreur seulement si pas de tâches déjà chargées
  if (!token && !isLoading) return <div className="task-list-container"><p>Vous devez être connecté pour voir les tâches.</p></div>;

  return (
    <div className="task-list-container">
      <h3>Tâches du Projet (ID: {projectId})</h3>

      {/* --- Formulaire d'AJOUT de tâche --- */}
      <form onSubmit={handleAddTaskSubmit} className="add-task-form" noValidate>
        <h4>Ajouter une nouvelle tâche</h4>
        <div>
          <label htmlFor="newTaskNameInput">Nom de la tâche :</label>
          <input
            type="text"
            id="newTaskNameInput"
            name="newTaskNameInput" // Modifié
            value={newTaskName}
            onChange={handleAddTaskInputChange} // Modifié
            required
            disabled={isSubmittingTask || !!deletingTaskId}
          />
          {addTaskFormErrors.newTaskName && <small className="field-error-message">{addTaskFormErrors.newTaskName}</small>}
        </div>
        <div>
          <label htmlFor="newTaskDescriptionInput">Description :</label>
          <textarea
            id="newTaskDescriptionInput"
            name="newTaskDescriptionInput" // Modifié
            value={newTaskDescription}
            onChange={handleAddTaskInputChange} // Modifié
            disabled={isSubmittingTask || !!deletingTaskId}
          />
        </div>
        <div>
          <label htmlFor="newTaskStatusSelect">Statut :</label>
          <select 
            id="newTaskStatusSelect"
            name="newTaskStatusSelect" // Modifié
            value={newTaskStatus} 
            onChange={handleAddTaskInputChange} // Modifié
            disabled={isSubmittingTask || !!deletingTaskId}
          >
            {statutsAutorises.map(status => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
          {addTaskFormErrors.newTaskStatus && <small className="field-error-message">{addTaskFormErrors.newTaskStatus}</small>}
        </div>
        <button type="submit" disabled={isSubmittingTask || !!deletingTaskId || !isAddTaskFormValid}>
          {isSubmittingTask ? 'Ajout en cours...' : 'Ajouter Tâche'}
        </button>
      </form>
      <hr className="form-tasks-separator" />

      {/* --- Liste des tâches --- */}
      {tasks.length > 0 ? (
        <ul>
          {tasks.map(task => (
            <li key={task.id} className={`task-item status-${task.statut?.replace(/\s+/g, '-').toLowerCase()} ${deletingTaskId === task.id ? 'deleting' : ''}`}>
              {editingTaskId === task.id ? (
                // --- FORMULAIRE D'ÉDITION de tâche ---
                <form onSubmit={handleUpdateTaskSubmit} className="edit-task-form" noValidate>
                  <div>
                    <label htmlFor={`editTaskName-${task.id}`}>Nom :</label>
                    <input
                      type="text"
                      id={`editTaskName-${task.id}`}
                      name={`editTaskName-${task.id}`} // Nom dynamique
                      value={editTaskName}
                      onChange={handleEditTaskInputChange} // Modifié
                      required
                      disabled={isUpdatingTask || !!deletingTaskId}
                    />
                    {editTaskFormErrors.editTaskName && <small className="field-error-message">{editTaskFormErrors.editTaskName}</small>}
                  </div>
                  <div>
                    <label htmlFor={`editTaskDescription-${task.id}`}>Description :</label>
                    <textarea
                      id={`editTaskDescription-${task.id}`}
                      name={`editTaskDescription-${task.id}`} // Nom dynamique
                      value={editTaskDescription}
                      onChange={handleEditTaskInputChange} // Modifié
                      disabled={isUpdatingTask || !!deletingTaskId}
                    />
                  </div>
                  <div>
                    <label htmlFor={`editTaskStatus-${task.id}`}>Statut :</label>
                    <select
                      id={`editTaskStatus-${task.id}`}
                      name={`editTaskStatus-${task.id}`} // Nom dynamique
                      value={editTaskStatus}
                      onChange={handleEditTaskInputChange} // Modifié
                      disabled={isUpdatingTask || !!deletingTaskId}
                    >
                      {statutsAutorises.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                    {editTaskFormErrors.editTaskStatus && <small className="field-error-message">{editTaskFormErrors.editTaskStatus}</small>}
                  </div>
                  <div className="task-actions">
                    <button type="submit" disabled={isUpdatingTask || !!deletingTaskId || !isEditTaskFormValid}>
                      {isUpdatingTask ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                    <button type="button" onClick={handleCancelEdit} disabled={isUpdatingTask || !!deletingTaskId}>
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                // --- AFFICHAGE NORMAL DE LA TÂCHE ---
                <>
                  <h4>{task.nom_tache}</h4>
                  <p>{task.description || "Pas de description."}</p>
                  <div className="task-details">
                    <span className="task-status">Statut: {task.statut}</span>
                    <span className="task-date">Créée le: {new Date(task.date_creation).toLocaleDateString()}</span>
                  </div>
                  <div className="task-actions">
                    <button onClick={() => handleEditTask(task)} className="button-edit" disabled={!!deletingTaskId || isSubmittingTask || isUpdatingTask}>
                      Modifier
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)} className="button-delete" disabled={deletingTaskId === task.id || (!!deletingTaskId && deletingTaskId !== task.id) || isSubmittingTask || isUpdatingTask }>
                      {deletingTaskId === task.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        // Condition modifiée pour correspondre à la logique de la version cible
        isLoading ? null : <p>Aucune tâche pour ce projet. Ajoutez-en une !</p>
      )}
    </div>
  );
}

export default TaskList;