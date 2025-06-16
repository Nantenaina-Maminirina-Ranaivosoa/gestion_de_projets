# Plateforme de Gestion de Projets Simplifiée

Bienvenue sur la Plateforme de Gestion de Projets Simplifiée ! Cette application full-stack vous permet de vous inscrire, de vous connecter, de créer des projets, et de gérer les tâches associées à ces projets.

## Fonctionnalités Principales

* **Authentification des Utilisateurs :**
    * Inscription de nouveaux utilisateurs.
    * Connexion des utilisateurs existants avec des tokens JWT (JSON Web Tokens).
    * Déconnexion.
* **Gestion de Projets (CRUD complet) :**
    * Créer de nouveaux projets (associés à l'utilisateur authentifié).
    * Afficher la liste des projets de l'utilisateur.
    * Voir les détails d'un projet spécifique.
    * Modifier les informations d'un projet.
    * Supprimer un projet (et ses tâches associées).
* **Gestion des Tâches (CRUD complet) :**
    * Ajouter des tâches à un projet spécifique.
    * Afficher les tâches d'un projet.
    * Modifier les détails d'une tâche (nom, description, statut).
    * Supprimer une tâche.
* **Interface Utilisateur Réactive :**
    * Construite avec React, utilisant React Router DOM pour la navigation.
    * Gestion de l'état global d'authentification avec React Context API.
    * Notifications "Toast" pour les retours utilisateur.
* **Validation des Données :**
    * Validation des formulaires côté frontend en temps réel (pour l'inscription, la création/modification de projets et tâches).
    * Validation robuste des données d'entrée côté backend avec `express-validator`.
* **Sécurité :**
    * Mots de passe hachés en base de données avec `bcrypt`.
    * Routes API protégées par authentification JWT.
    * Vérifications d'autorisation basiques (un utilisateur ne peut modifier/supprimer que ses propres ressources).

## Stack Technique

**Frontend :**
* React (v18+)
* React Router DOM (v6+)
* React Context API (pour la gestion de l'état d'authentification)
* `react-toastify` (pour les notifications)
* CSS (pour le style)

**Backend :**
* Node.js
* Express.js
* SQLite3 (comme base de données)
* `jsonwebtoken` (pour les tokens JWT)
* `bcrypt` (pour le hachage des mots de passe)
* `express-validator` (pour la validation des données API)
* `cors` (si vous l'avez configuré pour le développement cross-origin)

## Prérequis

* Node.js (version 16.x ou supérieure recommandée)
* npm (généralement inclus avec Node.js) ou yarn

## Installation et Lancement

1.  **Clonez le dépôt (si vous le partagez) :**
    ```bash
    git clone [https://github.com/Nantenaina-Maminirina-Ranaivosoa/gestion_de_projets.git]
    cd gestion_de_projets
    ```

2.  **Configuration du Backend :**
    ```bash
    cd backend
    npm install
    ```
    Créez un fichier `.env` à la racine du dossier `backend/` et ajoutez-y vos variables d'environnement :
    ```env
    PORT=3001  
    JWT_SECRET=votre_super_secret_jwt_personnel_et_complexe
    ```
    Démarrez le serveur backend :
    ```bash
    npm start 
    # ou node server.js (si 'start' n'est pas défini dans package.json)
    ```
    Le serveur devrait tourner sur `http://localhost:3001`.

3.  **Configuration du Frontend :**
    Ouvrez un nouveau terminal.
    ```bash
    cd client 
    # (Assurez-vous d'être dans le dossier client depuis la racine du projet)
    npm install
    ```
    Démarrez l'application React :
    ```bash
    npm start
    ```
    L'application React devrait s'ouvrir dans votre navigateur (généralement `http://localhost:3001` si le backend utilise 3000, ou `http://localhost:5173` si vous utilisez Vite avec un port par défaut).

## Comment Utiliser

1.  **Inscription :** Créez un nouveau compte via la page d'inscription.
2.  **Connexion :** Connectez-vous avec vos identifiants.
3.  **Gestion des Projets :**
    * Une fois connecté, vous serez redirigé vers la page des projets.
    * Utilisez le formulaire pour ajouter de nouveaux projets.
    * Cliquez sur un projet dans la liste pour voir ses détails et gérer ses tâches.
    * Utilisez les boutons "Modifier" et "Supprimer" sur la liste des projets pour gérer vos projets.
4.  **Gestion des Tâches :**
    * Sur la page de détail d'un projet, vous pouvez ajouter, voir, modifier et supprimer des tâches associées à ce projet.

## Améliorations Possibles (Pistes pour le Futur)

* Validation des formulaires côté frontend plus visuelle (par exemple, directement sous les champs). *(Note: nous l'avons fait, mais on peut toujours améliorer)*
* Notifications d'erreurs API plus spécifiques dans les toasts.
* Pagination pour les listes de projets et de tâches.
* Fonctionnalité de recherche/filtrage pour les projets et tâches.
* Possibilité d'assigner des utilisateurs à des tâches ou de partager des projets (plus complexe).
* Page de profil utilisateur (voir ses informations, changer son mot de passe).
* Tests unitaires et d'intégration.
* Déploiement sur une plateforme (Heroku, Vercel, Netlify, AWS, etc.).

## Auteur

* [Ranaivosoa Nantenaina Maminirina/Nantenaina-Maminirina-Ranaivosoa]
