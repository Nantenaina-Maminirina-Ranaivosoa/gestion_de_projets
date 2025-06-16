// backend/database/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Pour charger les variables d'environnement depuis .env

// Créer un pool de connexions à la base de données PostgreSQL
// Le constructeur Pool va automatiquement utiliser les variables d'environnement
// si elles sont nommées PGHOST, PGUSER, PGDATABASE, PGPASSWORD, PGPORT
// ou il peut utiliser directement l'URL de connexion DATABASE_URL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requis pour les connexions à Supabase/Heroku, etc.
  }
});

// Fonction pour exécuter les requêtes
const query = (text, params) => pool.query(text, params);

// Fonction pour initialiser la base de données (créer les tables si elles n'existent pas)
const initializeDatabase = async () => {
  console.log('Vérification et initialisation de la base de données...');
  try {
    // Syntaxe PostgreSQL pour la création de table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Utilisateurs (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255),
        prenom VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Projets (
        id SERIAL PRIMARY KEY,
        nom_projet VARCHAR(255) NOT NULL,
        description TEXT,
        utilisateur_id INTEGER REFERENCES Utilisateurs(id) ON DELETE CASCADE,
        date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Taches (
        id SERIAL PRIMARY KEY,
        nom_tache VARCHAR(255) NOT NULL,
        description TEXT,
        statut VARCHAR(50) DEFAULT 'à faire',
        projet_id INTEGER REFERENCES Projets(id) ON DELETE CASCADE,
        date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Les tables sont prêtes.');
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la base de données :', err.stack);
    // Si l'erreur se produit au démarrage, il est peut-être préférable d'arrêter le processus
    process.exit(1);
  }
};

module.exports = {
  query,
  initializeDatabase,
  pool // Exporter le pool peut être utile pour des transactions complexes
};