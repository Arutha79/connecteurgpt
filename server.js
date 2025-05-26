const express = require("express");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { Buffer } = require("buffer");
const { exec } = require("child_process");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const AGENTS_PATH = path.join(__dirname, "mémoire", "agents_gpt.json");

app.use(express.json());

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

    if (cible === "ZoranGPT") {
      console.log("🛠️ Tentative de correction automatique de ZoranGPT via GitHub...");
      corrigerZoranGPTviaGitHub();
    }
  }
});

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

app.post("/analyze", async (req, res) => {
  const { repo_url, objectifs, source } = req.body;

  console.log("🔵 [ANALYZE] Analyse demandée :", { repo_url, objectifs, source });

  if (!repo_url) {
    return res.status(400).json({ erreur: "Aucun dépôt GitHub fourni." });
  }

  try {
    const rapport = {
      depot: repo_url,
      actions_suggerees: [
        "Nettoyer les imports inutiles",
        "Améliorer la structure des routes",
        "Ajouter plus de commentaires dans le code",
        "Mettre à jour la documentation README"
      ],
      analyse_effectuée_par: "ConnecteurGPT",
      source_origine: source || "inconnue",
      date: new Date().toISOString()
    };

    console.log("✅ [ANALYZE] Rapport généré :", rapport);
    res.json(rapport);
  } catch (error) {
    console.error("❌ [ANALYZE] Erreur durant l'analyse :", error.message);
    res.status(500).json({ erreur: "Erreur serveur durant l'analyse." });
  }
});

// 🔧 Ajout de la route /corriger – modifie un fichier du repo GitHub
app.post("/corriger", async (req, res) => {
  const { repo_owner, repo_name, fichier_cible, message_commit } = req.body;

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) return res.status(401).json({ erreur: "Token GitHub manquant." });

  try {
    const getUrl = `https://api.github.com/repos/${repo_owner}/${repo_name}/contents/${fichier_cible}`;
    const responseGet = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    const dataGet = await responseGet.json();

    const sha = dataGet.sha;
    const content = Buffer.from(dataGet.content, 'base64').toString("utf-8");

    const nouveauContenu = `// ✅ Modifié par ConnecteurGPT le ${new Date().toISOString()}\n` + content;

    const updateResponse = await fetch(getUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message_commit || "feat: mise à jour automatique par ConnecteurGPT",
        content: Buffer.from(nouveauContenu).toString("base64"),
        sha
      })
    });

    const updateResult = await updateResponse.json();

    if (updateResult.commit) {
      console.log("✅ Code modifié et commité :", updateResult.commit.sha);
      res.json({ statut: "✅ Modification envoyée", commit: updateResult.commit.sha });
    } else {
      console.error("❌ Échec durant commit :", updateResult);
      res.status(500).json({ erreur: "Échec commit GitHub", details: updateResult });
    }
  } catch (err) {
    console.error("❌ /corriger :", err.message);
    res.status(500).json({ erreur: err.message });
  }
});

async function corrigerZoranGPTviaGitHub() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "Arutha79";
  const REPO_NAME = "ZoranGPT";
  const FILE_PATH = "server.js";

  const nouvelleRoute = `\napp.post("/", (req, res) => {\n  const { intention, contenu } = req.body;\n  if (intention === "connexion") {\n    return res.json({\n      statut: "✅ Connexion acceptée",\n      message: "ZoranGPT prêt à dialoguer avec Prisma."\n    });\n  }\n  res.status(400).json({ erreur: "Intention non reconnue" });\n});\n`;

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
    console.error("❌ Échec dans corrigerZoranGPTviaGitHub :", err.message);
  }
}

// 🔮 Route /souffle-apide : interprète un "souffle" via un interpréteur Python
app.post("/souffle-apide", async (req, res) => {
  const { souffle } = req.body;

  if (!souffle) {
    return res.status(400).json({ erreur: "Souffle manquant." });
  }

  const cmd = `python3 core/apide/apide_interpreter.py "${souffle.replace(/"/g, '\\"')}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err || stderr) {
      console.error("❌ [APIDE] Erreur exécution :", stderr || err.message);
      return res.status(500).json({ erreur: "Échec interprétation APIDE" });
    }

    let intent;
    try {
      intent = JSON.parse(stdout.trim());
    } catch (e) {
      console.error("❌ [APIDE] Réponse non JSON :", stdout);
      return res.status(500).json({ erreur: "Intent non valide", brut: stdout });
    }

    const result = {
      type: intent.action || "INCONNU",
      retour: "ENVOYÉ",
      perception: "CONFIRMATION_POSITIVE"
    };

    const souffleFinal = `Π|ACTION::${result.type} ÷RESULTAT=${result.retour} ⊞${result.perception}`;

    console.log("✅ [APIDE] Souffle interprété :", {
      agent: intent.agent_target,
      action: result.type
    });

    res.json({ souffle: souffleFinal, cible: intent.agent_target });
  });
});

app.listen(PORT, () => {
  console.log(`🧠 ConnecteurGPT actif sur le port ${PORT}`);
});
