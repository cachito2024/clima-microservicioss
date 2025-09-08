/* require('dotenv').config(); // carga variables de entorno
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // habilita CORS para todos los orígenes

// 🔗 Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.error('⚠️ Error al conectar a MongoDB Atlas:', err));

// 🔹 Schema y modelo de temperaturas
const temperaturaSchema = new mongoose.Schema({
  city: { type: String, required: true },
  temperature: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});

const TemperaturaAPI = mongoose.model('TemperaturaAPI', temperaturaSchema, 'temperatura_api');

// POST: insertar nuevas temperaturas
app.post('/temperatura_api', async (req, res) => {
  try {
    const newData = req.body;
    console.log('📥 REST API POST recibido:', newData);

    // Validar que sea un array
    if (!Array.isArray(newData)) {
      return res.status(400).send({ error: 'Se esperaba un array de objetos' });
    }

    // Insertar en MongoDB
    const result = await TemperaturaAPI.insertMany(newData);
    console.log('💾 Datos guardados en MongoDB:', result);

    res.status(201).send({ message: '✅ Datos almacenados correctamente' });
  } catch (err) {
    console.error('⚠️ Error guardando datos:', err);
    res.status(500).send({ error: 'Error al guardar datos', details: err.message });
  }
});

// GET: obtener todas las temperaturas
app.get('/temperatura_api', async (req, res) => {
  try {
    const data = await TemperaturaAPI.find().sort({ timestamp: 1 });
    res.json(data);
  } catch (err) {
    console.error('⚠️ Error obteniendo datos:', err);
    res.status(500).send({ error: 'Error al obtener datos', details: err.message });
  }
});

// 🔹 Servidor
app.listen(4000, () => {
  console.log('✅ REST API escuchando en http://localhost:4000');
});
 */

//con el render.. 
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// 🔗 Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.error('⚠️ Error al conectar a MongoDB Atlas:', err));

// 🔹 Schema y modelo
const temperaturaSchema = new mongoose.Schema({
  city: { type: String, required: true },
  temperature: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});

const TemperaturaAPI = mongoose.model('TemperaturaAPI', temperaturaSchema, 'temperatura_api');

// POST
app.post('/temperatura_api', async (req, res) => {
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
app.get('/temperatura_api', async (req, res) => {
  try {
    const data = await TemperaturaAPI.find().sort({ timestamp: 1 });
    res.json(data);
  } catch (err) {
    console.error('⚠️ Error obteniendo datos:', err);
    res.status(500).send({ error: 'Error al obtener datos', details: err.message });
  }
});

// Servidor
app.listen(4000, () => {
  console.log('✅ REST API escuchando en http://localhost:4000');
});
