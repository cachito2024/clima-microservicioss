// auth.js
require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors"); // <- agregar

const app = express();
app.use(express.json());
app.use(cors()); // <- agregar

// ===== RUTA DE SALUD =====
// Usala en UptimeRobot para que Render no lo "duerma"
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
}); 

// Endpoint de login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Validación muy básica (dummy)
  if (username === "admin" && password === "1234") {
    // Generar token
    const token = jwt.sign(
      { user: username }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" } // ⏳ dura 1 hora
    );
    return res.json({ token });
  }

  res.status(401).json({ message: "Credenciales inválidas" });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`✅ Auth service corriendo en puerto ${PORT}`);
});
