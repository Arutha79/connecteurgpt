// 🚦 crewDispatcher.js — Routeur intelligent pour ConnecteurGPT

const fetch = require("node-fetch");
const { loggerSouffle } = require("./logger");
const fs = require("fs");
const path = require("path");

const AGENTS_PATH = path.join(__dirname, "mémoire", "agents_gpt.json");

function chargerAgents() {
  try {
    const contenu = fs.readFileSync(AGENTS_PATH, "utf-8");
    return JSON.parse(contenu).connexions || {};
  } catch (err) {
    console.error("❌ Erreur lecture agents:", err.message);
    return {};
  }
}

async function dispatcherSouffle({ cible, intention, contenu }) {
  const agents = chargerAgents();
  const url = agents[cible];

  if (!url) {
    console.warn("⚠️ Aucune URL connue pour", cible);
    return { erreur: `Aucun agent connu pour ${cible}` };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intention, contenu })
    });

    const retour = await response.json();

    loggerSouffle({
      souffle: `INTENTION::${intention}`,
      cible,
      retour,
      status: "ROUTÉ"
    });

    return retour;
  } catch (err) {
    console.error("❌ [Dispatcher] Échec d'envoi à", cible, ":", err.message);
    return { erreur: `Erreur de communication avec ${cible}` };
  }
}

module.exports = { dispatcherSouffle };
