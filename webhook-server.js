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
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

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

app.listen(3000, () => {
  console.log('✅ Webhook escuchando en http://localhost:3000/webhook');
});
