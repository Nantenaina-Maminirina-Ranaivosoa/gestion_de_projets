// Importer le module sqlite3
const sqlite3 = require('sqlite3').verbose(); // .verbose() pour des messages d'erreur plus détaillés

// Définir le chemin vers le fichier de la base de données
// SQLite créera ce fichier s'il n'existe pas.
const DBSOURCE = "database/mydatabase.sqlite";

// Créer une instance de la base de données
// new sqlite3.Database(nom_fichier, [mode], [callback])
const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Erreur lors de la connexion à la base de données
        console.error('Erreur lors de la connexion à la base de données SQLite :', err.message);
        throw err; // Arrête l'application si la connexion échoue
    } else {
        console.log('Connecté à la base de données SQLite.');
        // On va créer la table des utilisateurs ici si elle n'existe pas encore
        db.serialize(() => { // Utiliser db.serialize pour s'assurer que les commandes s'exécutent en séquence
            // Table Utilisateurs
            db.run(`CREATE TABLE IF NOT EXISTS Utilisateurs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom TEXT,
                prenom TEXT,
                email TEXT UNIQUE,
                mot_de_passe TEXT, 
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('Erreur lors de la création de la table Utilisateurs :', err.message);
                } else {
                    console.log('Table Utilisateurs prête.');
                }
            });

            // NOUVELLE TABLE : Projets
            db.run(`CREATE TABLE IF NOT EXISTS Projets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom_projet TEXT NOT NULL,
                description TEXT,
                utilisateur_id INTEGER,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (utilisateur_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE 
                -- ON DELETE CASCADE: si un utilisateur est supprimé, ses projets le sont aussi
            )`, (err) => {
                if (err) {
                    console.error('Erreur lors de la création de la table Projets :', err.message);
                } else {
                    console.log('Table Projets prête.');
                }
            });

            // NOUVELLE TABLE : Taches
            db.run(`CREATE TABLE IF NOT EXISTS Taches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom_tache TEXT NOT NULL,
                description TEXT,
                statut TEXT DEFAULT 'à faire', -- 'à faire', 'en cours', 'terminé'
                projet_id INTEGER NOT NULL,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (projet_id) REFERENCES Projets(id) ON DELETE CASCADE
                -- ON DELETE CASCADE: si un projet est supprimé, ses tâches le sont aussi
            )`, (err) => {
                if (err) {
                    console.error('Erreur lors de la création de la table Taches :', err.message);
                } else {
                    console.log('Table Taches prête.');
                }
            });
        });
    }
});

module.exports = db;