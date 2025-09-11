/* const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  console.log('📥 Webhook recibió datos:', req.body);

  // Reenviar al REST API (punto 4)
  try {
    const response = await axios.post('http://localhost:4000/temperatura_api', req.body);
    console.log('📤 Webhook reenviando datos al REST API (punto 4):', response.data);
  } catch (err) {
    console.error('⚠️ Error reenviando al REST API:', err.response?.data || err.message);
  }

  res.status(200).send({ message: '✅ Webhook procesó los datos correctamente' });
});

app.listen(3000, () => {
  console.log('✅ Webhook escuchando en http://localhost:3000/webhook');
});
 */
//renderr 
/* require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Health check para Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Endpoint principal del Webhook
app.post('/webhook', async (req, res) => {
  console.log('📥 Webhook recibió datos:', req.body);

  try {
    const response = await axios.post(process.env.REST_API_URL, req.body);
    console.log('📤 Webhook → REST API:', response.data);
  } catch (err) {
    console.error('⚠️ Error reenviando al REST API:', err.response?.data || err.message);
  }

  res.status(200).send({ message: '✅ Webhook procesó los datos correctamente' });
});

// Usar el puerto asignado por Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Webhook escuchando en http://localhost:${PORT}/webhook`);
});
 */
//CON JWT
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

// Health check para Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Middleware para autenticar JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user; // queda disponible como req.user
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}

// Endpoint principal del Webhook con JWT
app.post('/webhook', authenticateToken, async (req, res) => {
  console.log('📥 Webhook recibió datos:', req.body);

  try {
    const response = await axios.post(process.env.REST_API_URL, req.body, {
      headers: {
        Authorization: `Bearer ${req.headers["authorization"].split(" ")[1]}`
      }
    });
    console.log('📤 Webhook → REST API:', response.data);
  } catch (err) {
    console.error('⚠️ Error reenviando al REST API:', err.response?.data || err.message);
  }

  res.status(200).send({ message: '✅ Webhook procesó los datos correctamente' });
});

// Usar el puerto asignado por Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Webhook escuchando en http://localhost:${PORT}/webhook`);
});
