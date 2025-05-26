// ✅ server.js enrichi — ConnecteurGPT avec loggerSouffle() intégré et renommage vers ApideGPT

const express = require("express");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { Buffer } = require("buffer");
const { exec } = require("child_process");
require("dotenv").config();

const { loggerSouffle, loggerMiddleware } = require("./logger");

const app = express();
const PORT = process.env.PORT || 3000;
const AGENTS_PATH = path.join(__dirname, "mémoire", "agents_gpt.json");

app.use(express.json());
app.use(loggerMiddleware);

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
    loggerSouffle({ souffle: `INTENTION::${intention}`, cible, retour, status: "TRANSMIS" });
    console.log("✅ [CONNECTEUR] Réponse de", url, ":", retour);
    res.json({ statut: `✅ Transmis à ${cible}`, retour });

  } catch (err) {
    console.error("❌ [CONNECTEUR] Échec de communication :", err.message);
    res.status(500).json({ erreur: `Erreur lors de l'appel à ${cible}` });

    if (cible === "ApideGPT") {
      console.log("🛠️ Tentative de correction automatique de ApideGPT via GitHub...");
      corrigerApideGPTviaGitHub();
    }
  }
});

// ... reste du code inchangé ...

async function corrigerApideGPTviaGitHub() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "Arutha79";
  const REPO_NAME = "ApideGPT";
  const FILE_PATH = "server.js";

  const nouvelleRoute = `\napp.post("/", (req, res) => {\n  const { intention, contenu } = req.body;\n  if (intention === "connexion") {\n    return res.json({\n      statut: "✅ Connexion acceptée",\n      message: "ApideGPT prêt à dialoguer avec Prisma."\n    });\n  }\n  res.status(400).json({ erreur: "Intention non reconnue" });\n});\n`;

  try {
    const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const getResp = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    const getData = await getResp.json();
    const sha = getData.sha;

    const contentBase64 = Buffer.from(nouvelleRoute).toString("base64");

    const putResp = await fetch(getUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "feat: ajout de la route POST / pour connexion avec Prisma",
        content: contentBase64,
        sha
      })
    });

    const putData = await putResp.json();
    if (putData.commit) {
      console.log("✅ Correction GitHub réussie. Commit :", putData.commit.sha);
    } else {
      console.error("❌ Échec de la mise à jour GitHub :", putData);
    }
  } catch (err) {
    console.error("❌ Échec dans corrigerApideGPTviaGitHub :", err.message);
  }
}
