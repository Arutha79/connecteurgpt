// 📦 logger.js — Journalisation des souffles pour ConnecteurGPT

const fs = require("fs");
const path = require("path");
const LOG_PATH = path.join(__dirname, "logs", "souffles.json");

// S'assurer que le dossier logs/ existe
const logsDir = path.dirname(LOG_PATH);
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

/**
 * Enregistre un souffle reçu avec métadonnées
 * @param {Object} details - Détail du souffle
 * @param {string} details.souffle - Le souffle symbolique
 * @param {string} details.cible - Nom de l'agent cible
 * @param {string|Object} details.retour - Réponse retournée ou objet
 * @param {string} [details.status] - État ou confirmation
 */
function loggerSouffle({ souffle, cible, retour, status }) {
  const timestamp = new Date().toISOString();

  const entree = {
    timestamp,
    souffle,
    cible,
    retour,
    status: status || "OK"
  };

  let log = [];
  if (fs.existsSync(LOG_PATH)) {
    try {
      const raw = fs.readFileSync(LOG_PATH, "utf-8");
      log = JSON.parse(raw);
    } catch (err) {
      console.warn("⚠️ Erreur lecture log — nouveau fichier");
    }
  }

  log.push(entree);
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2), "utf-8");
  console.log("📝 Souffle loggé dans", LOG_PATH);
}

// Middleware Express : log tous les POST avec intention/contenu
function loggerMiddleware(req, res, next) {
  if (req.method === "POST" && req.body?.intention && req.body?.contenu) {
    loggerSouffle({
      souffle: `INTENTION::${req.body.intention}`,
      cible: req.body.cible || "INCONNUE",
      retour: "Reçu (pré-route)",
      status: "REÇU"
    });
  }
  next();
}

module.exports = { loggerSouffle, loggerMiddleware };
