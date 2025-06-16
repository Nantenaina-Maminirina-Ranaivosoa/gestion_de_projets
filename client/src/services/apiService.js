// client/src/services/apiService.js

const getAuthToken = () => {
  return localStorage.getItem('token'); // Récupérer le token depuis localStorage
};

// Fonction wrapper pour les appels fetch
export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json', // Par défaut, peut être surchargé
    ...options.headers, // Permet de surcharger ou d'ajouter d'autres en-têtes
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Gestion globale des erreurs de réponse (optionnel mais recommandé)
  // Si la réponse n'est pas OK, essayer de parser le JSON pour l'erreur.
  if (!response.ok) {
    let errorData;
    try {
      // S'attendre à ce que l'API renvoie une erreur JSON comme { error: "message" }
      errorData = await response.json();
    } catch (e) {
      // Si le corps n'est pas JSON ou est vide
      errorData = { error: `HTTP error! status: ${response.status} ${response.statusText}` };
    }
    // Lancer une erreur pour qu'elle soit capturée par le .catch() de l'appelant
    const error = new Error(errorData.error || 'Une erreur est survenue.');
    error.status = response.status; // Attacher le statut à l'objet erreur
    error.response = response; // Attacher la réponse complète si besoin
    throw error;
  }

  // Si la réponse est 204 No Content (souvent pour DELETE), il n'y a pas de corps JSON
  if (response.status === 204) {
    return null; // Ou un objet indiquant le succès, ex: { success: true }
  }

  return response.json(); // Parser et retourner le corps JSON
};

// Exemples d'utilisation que vous pourriez exporter si vous centralisez tous les appels API :
// export const fetchProjects = () => authenticatedFetch('/api/projets');
// export const createProject = (projectData) => authenticatedFetch('/api/projets', {
//   method: 'POST',
//   body: JSON.stringify(projectData),
// });
// etc.