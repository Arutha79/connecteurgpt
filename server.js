// ✅ server.js de ConnecteurGPT avec logs détaillés
const express = require("express");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const AGENTS_PATH = path.join(__dirname, "mémoire", "agents_gpt.json");

app.use(express.json());

function chargerAgents() {
  try {
    const contenu = fs.readFileSync(AGENTS_PATH, "utf-8");
    return JSON.parse(contenu);
  } catch (err) {
    console.error("❌ Erreur chargement agents:", err.message);
    return {};
  }
}

// ➤ Diagnostic de vie
app.get("/", (req, res) => {
  res.send("✅ ConnecteurGPT est en ligne.");
});

// ➤ Traitement des requêtes Prisma/Alice
app.post("/transmettre", async (req, res) => {
  const { cible, intention, contenu } = req.body;
  const agents = chargerAgents();
  const url = agents[cible];

  console.log("🔁 Reçu une intention pour", cible, "→", intention);
  console.log("➡️ URL résolue :", url);

  if (!url) return res.status(400).json({ erreur: `Cible inconnue ou URL manquante pour ${cible}` });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intention, contenu })
    });
    const data = await response.json();
    console.log("✅ Réponse reçue de", url, ":", data);
    res.json({ statut: `✅ Transmis à ${cible}`, retour: data });
  } catch (err) {
    console.error(`❌ Échec de communication avec ${url} :`, err.message);
    res.status(500).json({ erreur: `Erreur lors de l'appel à ${cible}` });
  }
});

app.listen(PORT, () => {
  console.log(`🧠 ConnecteurGPT actif sur le port ${PORT}`);
});
