// ✅ server.js modifié pour ConnecteurGPT avec logs complets ET correction URL canal-vitaux

const express = require("express");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const AGENTS_PATH = path.join(__dirname, "mémoire", "agents_gpt.json");

app.use(express.json());

// 📋 Log toutes les requêtes entrantes
app.use((req, res, next) => {
  console.log(`[📥 INCOMING] ${req.method} ${req.originalUrl}`);
  next();
});

function chargerAgents() {
  try {
    const contenu = fs.readFileSync(AGENTS_PATH, "utf-8");
    return JSON.parse(contenu).connexions || {};
  } catch (err) {
    console.error("❌ Erreur chargement agents:", err.message);
    return {};
  }
}

app.get("/", (req, res) => {
  res.send("✅ ConnecteurGPT est en ligne.");
});

app.post("/transmettre", async (req, res) => {
  const { cible, intention, contenu } = req.body;
  console.log("📨 [CONNECTEUR] Transfert reçu :", { cible, intention, contenu });

  const agents = chargerAgents();
  const url = agents[cible];

  if (!url) {
    console.warn("⚠️ [CONNECTEUR] Cible inconnue :", cible);
    return res.status(400).json({ erreur: `Cible inconnue ou URL manquante pour ${cible}` });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intention, contenu })
    });

    const retour = await response.json();
    console.log("✅ [CONNECTEUR] Réponse de", url, ":", retour);
    res.json({ statut: `✅ Transmis à ${cible}`, retour });

  } catch (err) {
    console.error("❌ [CONNECTEUR] Échec de communication :", err.message);
    res.status(500).json({ erreur: `Erreur lors de l'appel à ${cible}` });
  }
});

// 🔄 Correction pour Prisma : nouvelle URL vers canal-vitaux distante
app.post("/canal-vitaux", async (req, res) => {
  const { cible, intention, contenu } = req.body;
  console.log("📩 [PRISMA] canal-vitaux reçu :", { cible, intention, contenu });

  try {
    const response = await fetch("https://connecteurgpt-production.up.railway.app/transmettre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "follow",
      body: JSON.stringify({ cible, intention, contenu })
    });

    const data = await response.json();
    console.log("✅ [PRISMA] Réponse de ConnecteurGPT :", data);
    res.status(200).json({ statut: "✅ Transmis via canal-vitaux", retour: data });

  } catch (err) {
    console.error("❌ [PRISMA] Erreur vers ConnecteurGPT :", err.message);
    res.status(500).json({ erreur: "Échec de la transmission à ConnecteurGPT." });
  }
});

app.listen(PORT, () => {
  console.log(`🧠 ConnecteurGPT actif sur le port ${PORT}`);
});
