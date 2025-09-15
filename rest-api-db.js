require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Health check para Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

//Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.error('⚠️ Error al conectar a MongoDB Atlas:', err));

// Schema y modelo
const temperaturaSchema = new mongoose.Schema({
  city: { type: String, required: true },
  temperature: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});

const TemperaturaAPI = mongoose.model('TemperaturaAPI', temperaturaSchema, 'temperatura_api');

// Middleware de autenticación JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; 
    next();
  });
}

// POST
app.post('/temperatura_api',  async (req, res) => {
  try {
    const newData = req.body;
    console.log('📥 REST API POST recibido:', newData);

    if (!Array.isArray(newData)) {
      return res.status(400).send({ error: 'Se esperaba un array de objetos' });
    }

    const result = await TemperaturaAPI.insertMany(newData);
    console.log('💾 Datos guardados en MongoDB:', result);

    res.status(201).send({ message: '✅ Datos almacenados correctamente' });
  } catch (err) {
    console.error('⚠️ Error guardando datos:', err);
    res.status(500).send({ error: 'Error al guardar datos', details: err.message });
  }
});

// GET
app.get('/temperatura_api',  authenticateToken , async (req, res) => {
  try {
    const data = await TemperaturaAPI.find().sort({ timestamp: 1 });
    res.json(data);
  } catch (err) {
    console.error('⚠️ Error obteniendo datos:', err);
    res.status(500).send({ error: 'Error al obtener datos', details: err.message });
  }
});

// Servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ REST API escuchando en http://localhost:${PORT}`);
});
