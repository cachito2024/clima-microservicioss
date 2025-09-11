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
/* require('dotenv').config();
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


// Endpoint principal del Webhook 
app.post('/webhook',    async (req, res) => {
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
 */

//moddd para auth
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

// Endpoint principal del Webhook 
app.post('/webhook', async (req, res) => {
  console.log('📥 Webhook recibió datos:', req.body);

  // Obtener token del header de manera segura
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No se proporcionó token" });
  }

  // Opcional: verificar token localmente si querés (no necesario si REST API lo valida)
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }

  try {
    const response = await axios.post(process.env.REST_API_URL, req.body, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('📤 Webhook → REST API:', response.data);
    res.status(200).json({ message: '✅ Webhook procesó los datos correctamente' });
  } catch (err) {
    console.error('⚠️ Error reenviando al REST API:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error al reenviar al REST API', details: err.message });
  }
});

// Usar el puerto asignado por Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Webhook escuchando en http://localhost:${PORT}/webhook`);
});
