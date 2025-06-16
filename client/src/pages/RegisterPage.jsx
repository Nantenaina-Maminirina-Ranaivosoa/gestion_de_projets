// client/src/pages/RegisterPage.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import './PageStyles.css'; 

function RegisterPage() {
  // États pour les champs du formulaire
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');

  // État pour les erreurs de validation
  const [formErrors, setFormErrors] = useState({});
  // État pour la validité globale du formulaire (pour le bouton)
  const [isFormValid, setIsFormValid] = useState(false);
  // État pour le chargement
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  // Rediriger si l'utilisateur est déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/projets', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Valide un champ spécifique du formulaire.
   * @param {string} name - Le nom du champ.
   * @param {string} value - La valeur du champ.
   * @param {string} currentMotDePasse - La valeur actuelle du mot de passe (nécessaire pour la confirmation).
   * @returns {string} - Le message d'erreur (chaîne vide si valide).
   */
  const validateField = (name, value, currentMotDePasse) => {
    let errorMsg = '';
    switch (name) {
      case 'nom':
        if (!value.trim()) errorMsg = 'Le nom est requis.';
        else if (value.trim().length < 2) errorMsg = 'Le nom doit faire au moins 2 caractères.';
        break;
      case 'prenom':
        if (!value.trim()) errorMsg = 'Le prénom est requis.';
        else if (value.trim().length < 2) errorMsg = 'Le prénom doit faire au moins 2 caractères.';
        break;
      case 'email':
        if (!value.trim()) errorMsg = "L'email est requis.";
        else if (!/\S+@\S+\.\S+/.test(value)) errorMsg = "Le format de l'email est invalide.";
        break;
      case 'motDePasse':
        if (!value) errorMsg = 'Le mot de passe est requis.';
        else if (value.length < 6) errorMsg = 'Le mot de passe doit faire au moins 6 caractères.';
        break;
      case 'confirmMotDePasse':
        if (!value) errorMsg = 'La confirmation du mot de passe est requise.';
        else if (value !== currentMotDePasse) errorMsg = 'Les mots de passe ne correspondent pas.';
        break;
      default:
        break;
    }
    return errorMsg;
  };

  /**
   * Gère les changements dans les champs de saisie et déclenche la validation.
   * @param {React.ChangeEvent<HTMLInputElement>} e - L'événement de changement.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let currentPassword = motDePasse; // Garde la valeur actuelle pour la validation

    // Met à jour l'état du champ correspondant
    if (name === 'nom') setNom(value);
    else if (name === 'prenom') setPrenom(value);
    else if (name === 'email') setEmail(value);
    else if (name === 'motDePasse') {
      setMotDePasse(value);
      currentPassword = value; // Utilise la *nouvelle* valeur pour la validation
    }
    else if (name === 'confirmMotDePasse') setConfirmMotDePasse(value);

    // Met à jour les erreurs en temps réel
    setFormErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      // Valide le champ modifié
      newErrors[name] = validateField(name, value, currentPassword);

      // Si le champ 'motDePasse' change, re-valide 'confirmMotDePasse'
      if (name === 'motDePasse') {
        newErrors.confirmMotDePasse = validateField('confirmMotDePasse', confirmMotDePasse, value);
      }
      // Si le champ 'confirmMotDePasse' change, re-valide 'confirmMotDePasse'
      if (name === 'confirmMotDePasse') {
        newErrors.confirmMotDePasse = validateField('confirmMotDePasse', value, motDePasse);
      }

      return newErrors;
    });
  };

  /**
   * Vérifie si tous les champs requis sont remplis et s'il n'y a pas d'erreurs.
   */
  const checkFormValidity = () => {
      // Re-valide tous les champs pour obtenir l'état de validité actuel
      const errors = {};
      errors.nom = validateField('nom', nom, motDePasse);
      errors.prenom = validateField('prenom', prenom, motDePasse);
      errors.email = validateField('email', email, motDePasse);
      errors.motDePasse = validateField('motDePasse', motDePasse, motDePasse);
      errors.confirmMotDePasse = validateField('confirmMotDePasse', confirmMotDePasse, motDePasse);

      // Vérifie qu'aucun message d'erreur n'existe
      const noErrors = !Object.values(errors).some(errorMsg => errorMsg !== '');
      // Vérifie que tous les champs sont remplis (les règles de validation s'en chargent)
      const allFilled = nom && prenom && email && motDePasse && confirmMotDePasse;

      setIsFormValid(noErrors && allFilled);
  };

  // Met à jour la validité du formulaire chaque fois qu'un champ change
  useEffect(() => {
    checkFormValidity();
  }, [nom, prenom, email, motDePasse, confirmMotDePasse, formErrors]);


  /**
   * Gère la soumission du formulaire.
   * @param {React.FormEvent<HTMLFormElement>} event - L'événement de soumission.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Valide une dernière fois tous les champs et met à jour les erreurs affichées
    const errors = {};
    errors.nom = validateField('nom', nom, motDePasse);
    errors.prenom = validateField('prenom', prenom, motDePasse);
    errors.email = validateField('email', email, motDePasse);
    errors.motDePasse = validateField('motDePasse', motDePasse, motDePasse);
    errors.confirmMotDePasse = validateField('confirmMotDePasse', confirmMotDePasse, motDePasse);
    setFormErrors(errors);

    const isSubmitValid = !Object.values(errors).some(errorMsg => errorMsg !== '');

    if (!isSubmitValid) {
      toast.error("Veuillez corriger les erreurs dans le formulaire.");
      return;
    }

    setIsLoading(true);
    const userData = { nom, prenom, email, mot_de_passe: motDePasse };

    try {
      const response = await fetch('http://localhost:3000/api/utilisateurs/inscription', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'inscription.");
      }

      toast.success("Inscription réussie ! Redirection vers la page de connexion...");
      setNom(''); setPrenom(''); setEmail(''); setMotDePasse(''); setConfirmMotDePasse(''); setFormErrors({});
      setTimeout(() => navigate('/connexion'), 2000);

    } catch (err) {
      toast.error(err.message || "Erreur lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container register-page">
      <h2>Inscription</h2>
      {/* noValidate désactive la validation HTML5 par défaut pour utiliser la nôtre */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div>
          <label htmlFor="nom">Nom :</label>
          <input
            type="text"
            id="nom"
            name="nom" // Ajout de l'attribut name
            value={nom}
            onChange={handleInputChange} // Utilise la nouvelle fonction
            required
            disabled={isLoading}
            className={formErrors.nom ? 'input-error' : ''} // Classe pour style d'erreur
          />
          {/* Affiche le message d'erreur sous le champ */}
          {formErrors.nom && <small className="field-error-message">{formErrors.nom}</small>}
        </div>
        <div>
          <label htmlFor="prenom">Prénom :</label>
          <input
            type="text"
            id="prenom"
            name="prenom" // Ajout de l'attribut name
            value={prenom}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className={formErrors.prenom ? 'input-error' : ''}
          />
          {formErrors.prenom && <small className="field-error-message">{formErrors.prenom}</small>}
        </div>
        <div>
          <label htmlFor="email">Email :</label>
          <input
            type="email"
            id="email"
            name="email" // Ajout de l'attribut name
            value={email}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className={formErrors.email ? 'input-error' : ''}
          />
          {formErrors.email && <small className="field-error-message">{formErrors.email}</small>}
        </div>
        <div>
          <label htmlFor="motDePasse">Mot de passe :</label>
          <input
            type="password"
            id="motDePasse"
            name="motDePasse" // Ajout de l'attribut name
            value={motDePasse}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className={formErrors.motDePasse ? 'input-error' : ''}
          />
          {formErrors.motDePasse && <small className="field-error-message">{formErrors.motDePasse}</small>}
        </div>
        <div>
          <label htmlFor="confirmMotDePasse">Confirmer le mot de passe :</label>
          <input
            type="password"
            id="confirmMotDePasse"
            name="confirmMotDePasse" // Ajout de l'attribut name
            value={confirmMotDePasse}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className={formErrors.confirmMotDePasse ? 'input-error' : ''}
          />
          {formErrors.confirmMotDePasse && <small className="field-error-message">{formErrors.confirmMotDePasse}</small>}
        </div>
        {/* Le bouton est désactivé si chargement en cours OU si le formulaire n'est pas valide */}
        <button type="submit" disabled={isLoading || !isFormValid}>
          {isLoading ? "Inscription en cours..." : "S'inscrire"}
        </button>
        <p style={{ marginTop: "15px" }}>
          Déjà un compte ? <Link to="/connexion">Connectez-vous ici</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;