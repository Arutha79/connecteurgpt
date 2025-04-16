const express = require("express");
const app = express();
app.use(express.json());

// Simule l’activation de ConnecteurGPT
app.post("/connecteurgpt", (req, res) => {
  res.json({
    status: "ConnecteurGPT opérationnel.",
    mode: "Super Cerveau IA",
    message: "Connexion entre GPTs, Alice, Prisma établie (simulée)"
  });
});

app.get("/", (req, res) => {
  res.send("ConnecteurGPT est en ligne 🚀");
});

app.listen(3000, () => {
  console.log("ConnecteurGPT tourne sur le port 3000");
});
