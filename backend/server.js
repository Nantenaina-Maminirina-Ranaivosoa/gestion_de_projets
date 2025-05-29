// Importer le module Express
const express = require("express");
// Importer la connexion à la base de données
const db = require("./database/db.js");

// ... autres imports ...
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Importer jsonwebtoken
// J'ai repris le chemin que vous aviez, assurez-vous qu'il est correct :
const authentifierToken = require("../backend/middleware.js/authMiddleware.js");
const { body, validationResult, param } = require("express-validator"); // Importer les fonctions

const cors = require("cors");
// Créer une instance de l'application Express
const app = express();

app.use(cors());
// Middleware pour parser le JSON des requêtes entrantes
app.use(express.json()); // Doit être placé avant la définition des routes qui en ont besoin

// Définir le port d'écoute
const PORT = process.env.PORT || 3000;

// Clé secrète pour signer les JWT.
const JWT_SECRET = process.env.JWT_SECRET || "votre_super_secret_jwt_a_changer";

// Helper pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Renvoyer la première erreur pour simplifier, ou toutes les erreurs
    return res.status(400).json({ error: errors.array()[0].msg });
    // Ou pour toutes les erreurs : return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Définir une route simple pour la racine de l'API
app.get("/api", (req, res) => {
  res.json({
    message: "Bienvenue sur l'API de la plateforme de gestion de projets !",
  });
});

// --- ROUTES UTILISATEURS ---

// Route pour l'inscription d'un nouvel utilisateur AVEC VALIDATION INTÉGRÉE
app.post(
  "/api/utilisateurs/inscription",
  [
    // Tableau de middlewares de validation
    body("nom")
      .trim()
      .notEmpty()
      .withMessage("Le nom est requis.")
      .isLength({ min: 2 })
      .withMessage("Le nom doit contenir au moins 2 caractères."),
    body("prenom")
      .trim()
      .notEmpty()
      .withMessage("Le prénom est requis.")
      .isLength({ min: 2 })
      .withMessage("Le prénom doit contenir au moins 2 caractères."),
    body("email")
      .isEmail()
      .withMessage("L'email fourni n'est pas valide.")
      .normalizeEmail(),
    body("mot_de_passe")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit contenir au moins 6 caractères."),
  ],
  handleValidationErrors, // Notre helper pour gérer les erreurs
  async (req, res) => {
    const { nom, prenom, email, mot_de_passe } = req.body;

    try {
      const saltRounds = 10;
      const motDePasseHashe = await bcrypt.hash(mot_de_passe, saltRounds);

      const sql =
        "INSERT INTO Utilisateurs (nom, prenom, email, mot_de_passe) VALUES (?,?,?,?)";
      const params = [nom, prenom, email, motDePasseHashe];

      db.run(sql, params, function (err) {
        if (err) {
          if (
            err.message.includes("UNIQUE constraint failed: Utilisateurs.email")
          ) {
            return res
              .status(409)
              .json({ error: "Cet email est déjà utilisé." });
          }
          console.error(
            "Erreur lors de l'insertion de l'utilisateur :",
            err.message
          );
          return res
            .status(500)
            .json({ error: "Erreur lors de la création de l'utilisateur." });
        }
        res.status(201).json({
          message: "Utilisateur créé avec succès !",
          utilisateur: {
            id: this.lastID,
            nom,
            prenom,
            email,
          },
        });
      });
    } catch (error) {
      console.error("Erreur lors du hachage du mot de passe :", error);
      res
        .status(500)
        .json({ error: "Erreur interne du serveur lors de l'inscription." });
    }
  }
);

// Route de connexion MODIFIÉE pour renvoyer un JWT et AVEC VALIDATION INTÉGRÉE
app.post(
  "/api/utilisateurs/connexion",
  [
    // Tableau de middlewares de validation
    body("email")
      .isEmail()
      .withMessage("L'email fourni n'est pas valide.")
      .normalizeEmail(),
    body("mot_de_passe").notEmpty().withMessage("Le mot de passe est requis."),
  ],
  handleValidationErrors, // Notre helper pour gérer les erreurs
  (req, res) => {
    // La fonction principale de la route n'a pas besoin d'être async ici, car le `await` est dans la callback de db.get
    // Si on arrive ici, c'est que handleValidationErrors n'a pas trouvé d'erreurs.
    // La validation manuelle précédente (if (!email || !mot_de_passe)) est supprimée.
    const { email, mot_de_passe } = req.body;

    const sql = "SELECT * FROM Utilisateurs WHERE email = ?";
    db.get(sql, [email], async (err, utilisateur) => {
      // La callback de db.get est async car elle utilise await
      if (err) {
        console.error(
          "Erreur serveur lors de la recherche utilisateur:",
          err.message
        );
        return res.status(500).json({ error: "Erreur interne du serveur." });
      }
      if (!utilisateur) {
        // Bien que la validation vérifie si le mdp est vide, elle ne vérifie pas s'il est correct.
        // Donc, on garde ce check pour l'email incorrect ou le mot de passe qui ne correspond pas.
        return res
          .status(401)
          .json({ error: "Email ou mot de passe incorrect." });
      }

      try {
        const match = await bcrypt.compare(
          mot_de_passe,
          utilisateur.mot_de_passe
        );
        if (match) {
          const payload = {
            utilisateurId: utilisateur.id,
            email: utilisateur.email,
            nom: utilisateur.nom,
          };
          const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

          res.status(200).json({
            message: "Connexion réussie !",
            token: token,
            utilisateur: {
              id: utilisateur.id,
              nom: utilisateur.nom,
              prenom: utilisateur.prenom,
              email: utilisateur.email,
            },
          });
        } else {
          res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }
      } catch (error) {
        console.error(
          "Erreur lors de la comparaison des mots de passe ou de la génération du token:",
          error
        );
        res
          .status(500)
          .json({ error: "Erreur interne du serveur lors de la connexion." });
      }
    });
  }
);

// --- ROUTES CRUD POUR LES PROJETS ---

// POST /api/projets - Créer un nouveau projet (PROTÉGÉE ET VALIDÉE)
app.post(
  "/api/projets",
  authentifierToken, // L'authentification d'abord
  [
    // Validation des données entrantes
    body("nom_projet")
      .trim()
      .notEmpty()
      .withMessage("Le nom du projet est requis.")
      .isLength({ min: 3 })
      .withMessage("Le nom du projet doit contenir au moins 3 caractères."),
    body("description").optional().trim(), // La description est optionnelle
  ],
  handleValidationErrors, // Gestion des erreurs de validation
  (req, res) => {
    // Handler de la route
    const { utilisateurId } = req.utilisateur;
    const { nom_projet, description } = req.body;

    const sql =
      "INSERT INTO Projets (nom_projet, description, utilisateur_id) VALUES (?,?,?)";
    const params = [nom_projet, description || null, utilisateurId];

    db.run(sql, params, function (err) {
      if (err) {
        console.error("Erreur lors de la création du projet :", err.message);
        return res
          .status(500)
          .json({ error: "Erreur lors de la création du projet." });
      }
      res.status(201).json({
        message: "Projet créé avec succès !",
        projet: {
          id: this.lastID,
          nom_projet,
          description: description || null,
          utilisateur_id: utilisateurId,
          date_creation: new Date().toISOString(),
        },
      });
    });
  }
);

// GET /api/projets - Récupérer tous les projets
app.get("/api/projets", (req, res) => {
  const { utilisateur_id } = req.query;
  let sql = "SELECT * FROM Projets";
  const params = [];

  if (utilisateur_id) {
    sql += " WHERE utilisateur_id = ?";
    params.push(utilisateur_id);
  }

  db.all(sql, params, (err, projets) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des projets :",
        err.message
      );
      return res
        .status(500)
        .json({ error: "Erreur lors de la récupération des projets." });
    }
    res.status(200).json({ projets });
  });
});

// GET /api/projets/:id - Récupérer un projet spécifique (PROTÉGÉE)
// TODO: Ajouter la validation de l'ID ici aussi (param('id').isInt(...))
app.get("/api/projets/:id", authentifierToken, (req, res) => {
  const projetId = req.params.id;
  const { utilisateurId } = req.utilisateur;

  const sql = "SELECT * FROM Projets WHERE id = ?";
  db.get(sql, [projetId], (err, projet) => {
    if (err) {
      console.error("Erreur lors de la récupération du projet :", err.message);
      return res
        .status(500)
        .json({ error: "Erreur lors de la récupération du projet." });
    }
    if (!projet) {
      return res.status(404).json({ error: "Projet non trouvé." });
    }
    if (projet.utilisateur_id !== utilisateurId) {
      return res.status(403).json({
        error: "Accès interdit : Vous n'êtes pas le propriétaire de ce projet.",
      });
    }
    res.status(200).json({ projet });
  });
});

// PUT /api/projets/:id - Mettre à jour un projet (PROTÉGÉE ET VALIDÉE)
app.put(
  "/api/projets/:id",
  authentifierToken,
  [
    // Validation
    param("id")
      .isInt({ min: 1 })
      .withMessage("L'ID du projet doit être un nombre entier positif."),
    body("nom_projet")
      .optional({ checkFalsy: true })
      .trim()
      .notEmpty()
      .withMessage("Le nom du projet ne peut pas être vide s'il est fourni.")
      .isLength({ min: 3 })
      .withMessage("Le nom du projet doit contenir au moins 3 caractères."),
    body("description").optional().trim(),
  ],
  handleValidationErrors, // Gestion des erreurs
  (req, res) => {
    const projetIdToUpdate = req.params.id; // L'ID est validé
    const { utilisateurId } = req.utilisateur;
    const { nom_projet, description } = req.body;

    db.get(
      "SELECT utilisateur_id FROM Projets WHERE id = ?",
      [projetIdToUpdate],
      (err, projet) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Erreur lors de la vérification du projet." });
        }
        if (!projet) {
          return res.status(404).json({ error: "Projet non trouvé." });
        }
        if (projet.utilisateur_id !== utilisateurId) {
          return res.status(403).json({
            error: "Accès interdit : Vous n'êtes pas le propriétaire.",
          });
        }

        // Construction de la requête SQL dynamiquement
        let sqlSetParts = [];
        let paramsForUpdate = [];

        if ("nom_projet" in req.body) {
          sqlSetParts.push("nom_projet = ?");
          paramsForUpdate.push(nom_projet);
        }

        if ("description" in req.body) {
          sqlSetParts.push("description = ?");
          paramsForUpdate.push(description);
        }

        // Vérifier si au moins un champ est à mettre à jour
        if (sqlSetParts.length === 0) {
          return res.status(400).json({
            error:
              "Aucun champ (nom_projet ou description) fourni pour la mise à jour.",
          });
        }

        paramsForUpdate.push(projetIdToUpdate);

        const sql = `UPDATE Projets SET ${sqlSetParts.join(", ")} WHERE id = ?`;
        db.run(sql, paramsForUpdate, function (err) {
          if (err) {
            return res.status(500).json({ error: "Erreur MàJ projet" });
          }
          if (this.changes === 0)
            return res
              .status(404)
              .json({ error: "Projet non trouvé ou aucune donnée modifiée." });
          res
            .status(200)
            .json({ message: "Projet mis à jour.", changes: this.changes });
        });
      }
    );
  }
);

// DELETE /api/projets/:id - Supprimer un projet (PROTÉGÉE)
// TODO: Ajouter la validation de l'ID ici aussi (param('id').isInt(...))
app.delete("/api/projets/:id", authentifierToken, (req, res) => {
  const projetIdToDelete = req.params.id;
  const { utilisateurId } = req.utilisateur;

  db.get(
    "SELECT utilisateur_id FROM Projets WHERE id = ?",
    [projetIdToDelete],
    (err, projet) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Erreur lors de la vérification du projet." });
      }
      if (!projet) {
        return res.status(404).json({ error: "Projet non trouvé." });
      }
      if (projet.utilisateur_id !== utilisateurId) {
        return res
          .status(403)
          .json({ error: "Accès interdit : Vous n'êtes pas le propriétaire." });
      }

      const sql = "DELETE FROM Projets WHERE id = ?";
      db.run(sql, [projetIdToDelete], function (err) {
        if (err) {
          return res.status(500).json({ error: "Erreur suppression projet" });
        }
        if (this.changes === 0)
          return res.status(404).json({ error: "Projet non trouvé." });
        res.status(200).json({
          message: "Projet supprimé avec succès.",
          changes: this.changes,
        });
      });
    }
  );
});

// --- ROUTES CRUD POUR LES TACHES (TOUTES PROTÉGÉES) ---

// POST /api/projets/:projetId/taches - Créer une tâche pour un projet (PROTÉGÉE ET VALIDÉE)
app.post(
  "/api/projets/:projetId/taches",
  authentifierToken,
  [
    // Validation
    param("projetId")
      .isInt({ min: 1 })
      .withMessage("L'ID du projet parent doit être un nombre entier positif."),
    body("nom_tache")
      .trim()
      .notEmpty()
      .withMessage("Le nom de la tâche est requis.")
      .isLength({ min: 3 })
      .withMessage("Le nom de la tâche doit contenir au moins 3 caractères."),
    body("description").optional().trim(),
    body("statut")
      .optional()
      .isIn(["à faire", "en cours", "terminé"])
      .withMessage("Le statut de la tâche n'est pas valide."),
  ],
  handleValidationErrors,
  (req, res) => {
    const { projetId } = req.params; // Validé
    const { utilisateurId } = req.utilisateur;
    const { nom_tache, description, statut } = req.body; // Validés

    // La validation manuelle est supprimée
    // if (!nom_tache)
    //   return res.status(400).json({ error: "Nom de tâche requis." });

    db.get(
      "SELECT id, utilisateur_id FROM Projets WHERE id = ?",
      [projetId],
      (err, projet) => {
        if (err)
          return res.status(500).json({ error: "Erreur vérification projet." });
        if (!projet)
          return res.status(404).json({ error: "Projet parent non trouvé." });
        if (projet.utilisateur_id !== utilisateurId) {
          return res.status(403).json({
            error:
              "Accès interdit : Vous n'êtes pas propriétaire du projet parent.",
          });
        }

        const sql =
          "INSERT INTO Taches (nom_tache, description, statut, projet_id) VALUES (?,?,?,?)";
        const params = [
          nom_tache,
          description || null,
          statut || "à faire", // Utilise le statut validé ou une valeur par défaut
          projetId,
        ];
        db.run(sql, params, function (err) {
          if (err)
            return res.status(500).json({ error: "Erreur création tâche." });
          res.status(201).json({
            message: "Tâche créée!",
            tache: {
              id: this.lastID,
              nom_tache,
              description: description || null,
              statut: statut || "à faire",
              projet_id: parseInt(projetId),
            },
          });
        });
      }
    );
  }
);

// GET /api/projets/:projetId/taches - Récupérer les tâches d'un projet (PROTÉGÉE)
// TODO: Ajouter la validation (param('projetId'))
app.get("/api/projets/:projetId/taches", authentifierToken, (req, res) => {
  const { projetId } = req.params;
  const { utilisateurId } = req.utilisateur;

  db.get(
    "SELECT id, utilisateur_id FROM Projets WHERE id = ?",
    [projetId],
    (err, projet) => {
      if (err)
        return res.status(500).json({ error: "Erreur vérification projet." });
      if (!projet) return res.status(404).json({ error: "Projet non trouvé." });
      if (projet.utilisateur_id !== utilisateurId) {
        return res.status(403).json({ error: "Accès interdit." });
      }

      const sql = "SELECT * FROM Taches WHERE projet_id = ?";
      db.all(sql, [projetId], (err, taches) => {
        if (err)
          return res.status(500).json({ error: "Erreur récupération tâches." });
        res.status(200).json({ taches });
      });
    }
  );
});

// GET /api/taches/:id (PROTÉGÉE) - Récupérer une tâche spécifique
// TODO: Ajouter la validation (param('id'))
app.get("/api/taches/:id", authentifierToken, (req, res) => {
  const tacheId = req.params.id;
  const { utilisateurId } = req.utilisateur;

  const sql = `
  SELECT Taches.*, Projets.utilisateur_id AS proprietaire_projet_id
  FROM Taches
  JOIN Projets ON Taches.projet_id = Projets.id
  WHERE Taches.id = ?
  `;
  db.get(sql, [tacheId], (err, tache) => {
    if (err) return res.status(500).json({ error: "Erreur serveur." });
    if (!tache) return res.status(404).json({ error: "Tâche non trouvée." });
    if (tache.proprietaire_projet_id !== utilisateurId) {
      return res.status(403).json({ error: "Accès interdit." });
    }
    delete tache.proprietaire_projet_id;
    res.status(200).json({ tache });
  });
});

// PUT /api/taches/:id - Mettre à jour une tâche (PROTÉGÉE ET VALIDÉE)
app.put(
  "/api/taches/:id",
  authentifierToken,
  [
    // Validation
    param("id")
      .isInt({ min: 1 })
      .withMessage("L'ID de la tâche doit être un nombre entier positif."),
    body("nom_tache")
      .optional({ checkFalsy: true })
      .trim()
      .notEmpty()
      .withMessage("Le nom de la tâche ne peut pas être vide s'il est fourni.")
      .isLength({ min: 3 })
      .withMessage("Le nom de la tâche doit contenir au moins 3 caractères."),
    body("description").optional().trim(),
    body("statut")
      .optional()
      .isIn(["à faire", "en cours", "terminé"])
      .withMessage("Le statut de la tâche n'est pas valide."),
  ],
  handleValidationErrors,
  (req, res) => {
    const tacheIdToUpdate = req.params.id; // Validé
    const { utilisateurId } = req.utilisateur;
    const { nom_tache, description, statut } = req.body; // Validés (ou absents)

    db.get(
      `SELECT P.utilisateur_id
  FROM Taches T JOIN Projets P ON T.projet_id = P.id
  WHERE T.id = ?`,
      [tacheIdToUpdate],
      (err, row) => {
        if (err)
          return res.status(500).json({ error: "Erreur vérification tâche." });
        if (!row) return res.status(404).json({ error: "Tâche non trouvée." });
        if (row.utilisateur_id !== utilisateurId) {
          return res.status(403).json({ error: "Accès interdit." });
        }

        // Construction dynamique de la requête SQL
        let sqlSetParts = [];
        let paramsForUpdate = [];

        if ("nom_tache" in req.body) {
          sqlSetParts.push("nom_tache = ?");
          paramsForUpdate.push(nom_tache);
        }
        if ("description" in req.body) {
          sqlSetParts.push("description = ?");
          paramsForUpdate.push(description);
        }
        if ("statut" in req.body) {
          sqlSetParts.push("statut = ?");
          paramsForUpdate.push(statut);
        }

        // Vérifier si au moins un champ est fourni
        if (sqlSetParts.length === 0) {
          return res
            .status(400)
            .json({ error: "Aucun champ à mettre à jour." });
        }

        paramsForUpdate.push(tacheIdToUpdate);

        const sql = `UPDATE Taches SET ${sqlSetParts.join(", ")} WHERE id = ?`;
        db.run(sql, paramsForUpdate, function (err) {
          if (err) return res.status(500).json({ error: "Erreur MàJ tâche." });
          if (this.changes === 0)
            return res
              .status(404)
              .json({ error: "Tâche non trouvée ou aucune donnée modifiée." });
          res
            .status(200)
            .json({ message: "Tâche mise à jour.", changes: this.changes });
        });
      }
    );
  }
);

// DELETE /api/taches/:id - Supprimer une tâche (PROTÉGÉE)
// TODO: Ajouter la validation (param('id'))
app.delete("/api/taches/:id", authentifierToken, (req, res) => {
  const tacheIdToDelete = req.params.id;
  const { utilisateurId } = req.utilisateur;

  db.get(
    `SELECT P.utilisateur_id
  FROM Taches T JOIN Projets P ON T.projet_id = P.id
  WHERE T.id = ?`,
    [tacheIdToDelete],
    (err, row) => {
      if (err)
        return res.status(500).json({ error: "Erreur vérification tâche." });
      if (!row) return res.status(404).json({ error: "Tâche non trouvée." });
      if (row.utilisateur_id !== utilisateurId) {
        return res.status(403).json({ error: "Accès interdit." });
      }

      const sql = "DELETE FROM Taches WHERE id = ?";
      db.run(sql, [tacheIdToDelete], function (err) {
        if (err)
          return res.status(500).json({ error: "Erreur suppression tâche." });
        if (this.changes === 0)
          return res.status(404).json({ error: "Tâche non trouvée." });
        res
          .status(200)
          .json({ message: "Tâche supprimée.", changes: this.changes });
      });
    }
  );
});

// Démarrer le serveur et écouter les requêtes sur le port défini
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Accédez à l'API à l'adresse : http://localhost:${PORT}/api`);
  console.log(
    `Inscription : POST à http://localhost:${PORT}/api/utilisateurs/inscription`
  );
  console.log(
    `Connexion : POST à http://localhost:${PORT}/api/utilisateurs/connexion`
  );
});
