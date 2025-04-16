const express = require("express");
const app = express();
app.use(express.json());

// ➤ Endpoint de diagnostic
app.get("/", (req, res) => {
  res.send("✅ ConnecteurGPT est en ligne.");
});

// ➤ Endpoint principal (simulation d’orchestration)
app.post("/connecteurgpt", (req, res) => {
  const { action, cible } = req.body;

  if (action === "connect" && cible === "supercerveau") {
    return res.json({
      status: "Succès",
      message: "ConnecteurGPT a orchestré Alice ↔ Prisma ↔ GPTs.",
      logs: ["Alice → OK", "Prisma → OK", "Railway → Préparé", "GitHub → Monitoré"]
    });
  }

  res.status(400).json({
    error: "Commande inconnue. Utilise action: 'connect', cible: 'supercerveau'."
  });
});

// ➤ Port Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🧠 ConnecteurGPT actif sur le port ${PORT}`);
});
