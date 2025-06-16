// api/index.js (Anciennement server.js)
// --- Imports ---
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult, param } = require("express-validator");

// --- Configuration de la Base de Données (PostgreSQL) ---
// Note : Le fichier database/db.js est maintenant intégré ici pour plus de simplicité.
// Assurez-vous d'avoir installé 'pg' et 'dotenv': npm install pg dotenv
require('dotenv').config(); // Charge les variables de .env (DATABASE_URL, JWT_SECRET)
const { Pool } = require('pg');

const pool = new Pool({
  // L'URL de votre base de données Supabase sera lue depuis la variable d'environnement DATABASE_URL
  connectionString: process.env.DATABASE_URL,
  // Requis pour les connexions à des services comme Supabase, Heroku, etc.
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper pour exécuter les requêtes SQL
const dbQuery = (text, params) => pool.query(text, params);


// --- Middlewares et Configuration Express ---
const app = express();
app.use(cors()); // Active CORS pour toutes les routes
app.use(express.json()); // Middleware pour parser le JSON

// --- Middleware d'Authentification ---
// Note: Le chemin est simplifié car ce fichier sera dans le dossier api/
const JWT_SECRET = process.env.JWT_SECRET || "votre_super_secret_jwt_a_changer";

const authentifierToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    return res.status(401).json({ error: 'Accès non autorisé : Token manquant.' });
  }
  jwt.verify(token, JWT_SECRET, (err, utilisateurPayload) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Accès interdit : Token expiré.' });
      }
      return res.status(403).json({ error: 'Accès interdit : Token invalide.' });
    }
    req.utilisateur = utilisateurPayload;
    next();
  });
};

// --- Helper pour la Validation ---
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};


// --- ROUTES DE L'API ---

// Route de test
app.get("/api", (req, res) => {
  res.json({ message: "Bienvenue sur l'API de la Plateforme de Gestion de Projets !" });
});

// --- Routes Utilisateurs ---
app.post('/api/utilisateurs/inscription',
  [
    body('nom').trim().isLength({ min: 2 }).withMessage("Le nom doit faire au moins 2 caractères."),
    body('prenom').trim().isLength({ min: 2 }).withMessage("Le prénom doit faire au moins 2 caractères."),
    body('email').isEmail().withMessage("L'email n'est pas valide.").normalizeEmail(),
    body('mot_de_passe').isLength({ min: 6 }).withMessage("Le mot de passe doit faire au moins 6 caractères.")
  ],
  handleValidationErrors,
  async (req, res) => {
    const { nom, prenom, email, mot_de_passe } = req.body;
    try {
      const motDePasseHashe = await bcrypt.hash(mot_de_passe, 10);
      // CHANGEMENT: La syntaxe SQL utilise $1, $2... pour les paramètres et RETURNING id pour récupérer l'ID.
      const sql = 'INSERT INTO Utilisateurs (nom, prenom, email, mot_de_passe) VALUES ($1, $2, $3, $4) RETURNING id';
      const result = await dbQuery(sql, [nom, prenom, email, motDePasseHashe]);
      
      res.status(201).json({
        message: 'Utilisateur créé avec succès !',
        utilisateur: { id: result.rows[0].id, nom, prenom, email },
      });
    } catch (err) {
      // CHANGEMENT: Gestion d'erreur spécifique à PostgreSQL pour les emails dupliqués.
      if (err.code === '23505') { // Code d'erreur pour violation de contrainte unique
        return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
      }
      console.error("Erreur lors de l'inscription :", err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

app.post('/api/utilisateurs/connexion',
  [
    body('email').isEmail().withMessage("L'email n'est pas valide.").normalizeEmail(),
    body('mot_de_passe').notEmpty().withMessage("Le mot de passe est requis.")
  ],
  handleValidationErrors,
  async (req, res) => {
    const { email, mot_de_passe } = req.body;
    try {
      const sql = 'SELECT * FROM Utilisateurs WHERE email = $1';
      const result = await dbQuery(sql, [email]);
      const utilisateur = result.rows[0]; // La première ligne du résultat

      if (!utilisateur) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      }

      const match = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
      if (match) {
        const payload = { utilisateurId: utilisateur.id, email: utilisateur.email, nom: utilisateur.nom };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
          message: 'Connexion réussie !',
          token,
          utilisateur: { id: utilisateur.id, nom: utilisateur.nom, prenom: utilisateur.prenom, email: utilisateur.email },
        });
      } else {
        res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      }
    } catch (err) {
      console.error("Erreur lors de la connexion :", err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);


// --- Routes Projets (Protégées) ---
app.get('/api/projets', authentifierToken, async (req, res) => {
  const { utilisateurId } = req.utilisateur;
  try {
    const sql = 'SELECT * FROM Projets WHERE utilisateur_id = $1 ORDER BY date_creation DESC';
    const result = await dbQuery(sql, [utilisateurId]);
    res.status(200).json({ projets: result.rows });
  } catch (err) {
    console.error("Erreur récupération projets :", err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

app.post('/api/projets',
  authentifierToken,
  [
    body('nom_projet').trim().isLength({ min: 3 }).withMessage("Le nom du projet doit faire au moins 3 caractères."),
    body('description').optional().trim()
  ],
  handleValidationErrors,
  async (req, res) => {
    const { utilisateurId } = req.utilisateur;
    const { nom_projet, description } = req.body;
    try {
      const sql = 'INSERT INTO Projets (nom_projet, description, utilisateur_id) VALUES ($1, $2, $3) RETURNING id, date_creation';
      const result = await dbQuery(sql, [nom_projet, description || null, utilisateurId]);
      res.status(201).json({
        message: 'Projet créé avec succès !',
        projet: {
          id: result.rows[0].id,
          nom_projet,
          description: description || null,
          utilisateur_id: utilisateurId,
          date_creation: result.rows[0].date_creation,
        },
      });
    } catch (err) {
      console.error("Erreur création projet :", err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

app.get('/api/projets/:id', authentifierToken, [param('id').isInt()], handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    const { utilisateurId } = req.utilisateur;
    try {
        const result = await dbQuery('SELECT * FROM Projets WHERE id = $1 AND utilisateur_id = $2', [id, utilisateurId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Projet non trouvé ou accès non autorisé.' });
        }
        res.status(200).json({ projet: result.rows[0] });
    } catch (err) {
        console.error("Erreur récupération projet par ID :", err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

app.put('/api/projets/:id',
  authentifierToken,
  [
    param('id').isInt(),
    body('nom_projet').optional({ checkFalsy: true }).trim().isLength({ min: 3 }),
    body('description').optional().trim()
  ],
  handleValidationErrors,
  async (req, res) => {
    const { id } = req.params;
    const { utilisateurId } = req.utilisateur;
    const { nom_projet, description } = req.body;
    try {
        // La construction de la requête dynamique est un peu plus complexe avec pg
        const fields = [];
        const values = [];
        let queryIndex = 1;

        if (nom_projet !== undefined) {
            fields.push(`nom_projet = $${queryIndex++}`);
            values.push(nom_projet);
        }
        if (description !== undefined) {
            fields.push(`description = $${queryIndex++}`);
            values.push(description);
        }
        if (fields.length === 0) {
            return res.status(400).json({ error: "Aucun champ à mettre à jour." });
        }
        
        values.push(id, utilisateurId); // Ajouter les IDs pour la clause WHERE
        const sql = `UPDATE Projets SET ${fields.join(', ')} WHERE id = $${queryIndex++} AND utilisateur_id = $${queryIndex++}`;
        
        const result = await dbQuery(sql, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Projet non trouvé, accès non autorisé ou aucune donnée modifiée.' });
        }
        res.status(200).json({ message: 'Projet mis à jour avec succès.', changes: result.rowCount });
    } catch(err) {
        console.error("Erreur MàJ projet :", err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

app.delete('/api/projets/:id', authentifierToken, [param('id').isInt()], handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    const { utilisateurId } = req.utilisateur;
    try {
        const sql = 'DELETE FROM Projets WHERE id = $1 AND utilisateur_id = $2';
        const result = await dbQuery(sql, [id, utilisateurId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Projet non trouvé ou accès non autorisé.' });
        }
        res.status(200).json({ message: 'Projet supprimé avec succès.', changes: result.rowCount });
    } catch (err) {
        console.error("Erreur suppression projet :", err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});


// --- Routes Tâches (Protégées) ---
app.get('/api/projets/:projetId/taches', authentifierToken, [param('projetId').isInt()], handleValidationErrors, async (req, res) => {
    const { projetId } = req.params;
    const { utilisateurId } = req.utilisateur;
    try {
        // Vérifier d'abord que l'utilisateur est propriétaire du projet
        const projetCheck = await dbQuery('SELECT id FROM Projets WHERE id = $1 AND utilisateur_id = $2', [projetId, utilisateurId]);
        if (projetCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Projet non trouvé ou accès non autorisé.' });
        }
        // Puis récupérer les tâches
        const result = await dbQuery('SELECT * FROM Taches WHERE projet_id = $1 ORDER BY date_creation ASC', [projetId]);
        res.status(200).json({ taches: result.rows });
    } catch(err) {
        console.error("Erreur récupération tâches :", err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

app.post('/api/projets/:projetId/taches',
  authentifierToken,
  [
    param('projetId').isInt(),
    body('nom_tache').trim().isLength({ min: 3 }),
    body('statut').optional().isIn(['à faire', 'en cours', 'terminé'])
  ],
  handleValidationErrors,
  async (req, res) => {
    const { projetId } = req.params;
    const { utilisateurId } = req.utilisateur;
    const { nom_tache, description, statut } = req.body;
    try {
        // Vérifier la propriété du projet avant d'insérer
        const projetCheck = await dbQuery('SELECT id FROM Projets WHERE id = $1 AND utilisateur_id = $2', [projetId, utilisateurId]);
        if (projetCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Projet non trouvé ou accès non autorisé.' });
        }

        const sql = 'INSERT INTO Taches (nom_tache, description, statut, projet_id) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await dbQuery(sql, [nom_tache, description || null, statut || 'à faire', projetId]);
        res.status(201).json({ message: 'Tâche créée avec succès !', tache: result.rows[0] });
    } catch(err) {
        console.error("Erreur création tâche :", err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

// Pour PUT et DELETE sur /api/taches/:id, il faut d'abord vérifier la propriété via une jointure.
// C'est un peu plus complexe, mais très important pour la sécurité.

app.put('/api/taches/:id',
  authentifierToken,
  [ param('id').isInt(), /* ... autres validations body ... */],
  handleValidationErrors,
  async (req, res) => {
      const { id } = req.params;
      const { utilisateurId } = req.utilisateur;
      const { nom_tache, description, statut } = req.body;

      try {
          // Construction dynamique de la requête
          const fields = []; let values = []; let queryIndex = 1;
          if (nom_tache !== undefined) { fields.push(`nom_tache = $${queryIndex++}`); values.push(nom_tache); }
          if (description !== undefined) { fields.push(`description = $${queryIndex++}`); values.push(description); }
          if (statut !== undefined) { fields.push(`statut = $${queryIndex++}`); values.push(statut); }
          if (fields.length === 0) return res.status(400).json({ error: "Aucun champ à mettre à jour." });

          // La clause WHERE vérifie à la fois l'ID de la tâche ET la propriété du projet parent
          const sql = `
            UPDATE Taches SET ${fields.join(', ')} 
            WHERE id = $${queryIndex++} AND projet_id IN (SELECT id FROM Projets WHERE utilisateur_id = $${queryIndex++})
            RETURNING *
          `;
          values.push(id, utilisateurId);

          const result = await dbQuery(sql, values);
          if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée ou accès non autorisé.' });
          }
          res.status(200).json({ message: 'Tâche mise à jour.', tache: result.rows[0] });
      } catch (err) {
          console.error("Erreur MàJ tâche :", err);
          res.status(500).json({ error: 'Erreur interne du serveur.' });
      }
  }
);

app.delete('/api/taches/:id', authentifierToken, [param('id').isInt()], handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    const { utilisateurId } = req.utilisateur;
    try {
        const sql = `
            DELETE FROM Taches 
            WHERE id = $1 AND projet_id IN (SELECT id FROM Projets WHERE utilisateur_id = $2)
        `;
        const result = await dbQuery(sql, [id, utilisateurId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée ou accès non autorisé.' });
        }
        res.status(200).json({ message: 'Tâche supprimée avec succès.' });
    } catch(err) {
        console.error("Erreur suppression tâche :", err);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});


// --- Initialisation de la Base de Données et Export ---

// Fonction pour initialiser la base de données (créer les tables si elles n'existent pas)
const initializeDatabase = async () => {
  console.log('Vérification et initialisation de la base de données PostgreSQL...');
  try {
    // Note: 'SERIAL PRIMARY KEY' est pour PostgreSQL, équivalent de 'INTEGER PRIMARY KEY AUTOINCREMENT'
    // 'TIMESTAMPTZ' est un timestamp avec fuseau horaire, une meilleure pratique.
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS Utilisateurs (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255),
        prenom VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS Projets (
        id SERIAL PRIMARY KEY,
        nom_projet VARCHAR(255) NOT NULL,
        description TEXT,
        utilisateur_id INTEGER REFERENCES Utilisateurs(id) ON DELETE CASCADE,
        date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS Taches (
        id SERIAL PRIMARY KEY,
        nom_tache VARCHAR(255) NOT NULL,
        description TEXT,
        statut VARCHAR(50) DEFAULT 'à faire',
        projet_id INTEGER NOT NULL REFERENCES Projets(id) ON DELETE CASCADE,
        date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Les tables de la base de données sont prêtes.');
  } catch (err) {
    console.error('Erreur critique lors de l\'initialisation de la base de données :', err.stack);
    process.exit(1); // Arrêter l'application si la base de données ne peut pas être initialisée
  }
};

// Initialiser la base de données au démarrage du serveur
initializeDatabase();

// Exporter l'application Express pour que Vercel puisse l'utiliser
module.exports = app;
