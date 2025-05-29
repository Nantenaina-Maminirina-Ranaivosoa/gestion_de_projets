// authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'votre_super_secret_jwt_a_changer'; // Doit être le même secret

const authentifierToken = (req, res, next) => {
  // Récupérer le token depuis l'en-tête Authorization
  // Format attendu: "Bearer TOKEN_STRING"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Récupère "TOKEN_STRING"

  if (token == null) {
    // Pas de token fourni
    return res.status(401).json({ error: 'Accès non autorisé : Token manquant.' }); 
  }

  // Vérifier le token
  jwt.verify(token, JWT_SECRET, (err, utilisateurPayload) => {
    if (err) {
      // Token invalide (expiré, malformé, signature incorrecte)
      console.error('Erreur de vérification JWT:', err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Accès interdit : Token expiré.' }); // 403 Forbidden
      }
      return res.status(403).json({ error: 'Accès interdit : Token invalide.' }); // 403 Forbidden
    }

    // Le token est valide, le payload est dans utilisateurPayload
    // On attache le payload à l'objet requête pour y accéder dans les routes protégées
    req.utilisateur = utilisateurPayload; 
    next(); // Passe au prochain middleware ou à la route
  });
};

module.exports = authentifierToken;