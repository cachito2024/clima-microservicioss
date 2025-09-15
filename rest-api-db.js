// rest-api.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Health
app.get('/health', (_req, res) => res.status(200).send('OK'));

// (DEBUG) Ver IP pública de egreso para whitelist en Atlas
app.get('/debug/egress-ip', async (_req, res) => {
  try {
    const { data } = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
    res.json({ ip: data.ip });
  } catch (e) {
    res.status(500).json({ error: 'No pude obtener IP', detail: e.message });
  }
});

// ======= Mongo =======
mongoose.set('bufferCommands', false); // no buferizar si no hay conexión

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI; // acepta ambos nombres
if (!mongoUri) {
  console.error('❌ Falta MONGODB_URI/MONGO_URI en .env');
  process.exit(1);
}

// Schema y modelo
const temperaturaSchema = new mongoose.Schema({
  city: { type: String, required: true },
  temperature: { type: Number, required: true },
  timestamp: { type: Date, required: true }
}, { versionKey: false });

const TemperaturaAPI = mongoose.model('TemperaturaAPI', temperaturaSchema, 'temperatura_api');

// Auth middleware
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// POST (protegido; si no querés protegerlo, quitá el middleware)
app.post('/temperatura_api', authenticateToken, async (req, res) => {
  try {
    const payload = req.body;
    console.log('📥 REST API POST recibido:', payload);

    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: 'Se esperaba un array de objetos' });
    }
    // validación mínima
    for (const it of payload) {
      if (typeof it.city !== 'string' || typeof it.temperature !== 'number' || !it.timestamp) {
        return res.status(400).json({ error: 'Campos inválidos en el array' });
      }
    }

    const result = await TemperaturaAPI.insertMany(payload, { ordered: false });
    console.log('💾 Guardados en MongoDB:', result.length);
    res.status(201).json({ message: '✅ Datos almacenados', inserted: result.length });
  } catch (err) {
    console.error('⚠️ Error guardando datos:', err.message);
    res.status(500).json({ error: 'Error al guardar datos', details: err.message });
  }
});

// GET
app.get('/temperatura_api', authenticateToken, async (_req, res) => {
  try {
    const data = await TemperaturaAPI.find().sort({ timestamp: 1 });
    res.json(data);
  } catch (err) {
    console.error('⚠️ Error obteniendo datos:', err.message);
    res.status(500).json({ error: 'Error al obtener datos', details: err.message });
  }
});

// ======= Boot: conectar primero y recién después listen =======
const PORT = process.env.PORT || 4000;

async function boot() {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 60000, // hasta 60s para seleccionar nodo
      socketTimeoutMS: 120000,
      // useNewUrlParser / useUnifiedTopology ya no son necesarios en Mongoose 7/8
    });
    console.log('✅ Conectado a MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`✅ REST API escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('🟥 No pude conectar a Mongo:', err.message);
    process.exit(1);
  }
}

boot();
