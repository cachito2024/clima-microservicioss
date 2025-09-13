//WEBHOOK
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

//  Funciones de backoff 
const BASE_MS = 1000;   // 1s
const MAX_MS = 60_000;  // 60s
function msBackoffTry(n) {
  const exp = Math.min(MAX_MS, BASE_MS * Math.pow(2, n));
  return Math.round(exp * (0.5 + Math.random())); // jitter
}

//  Función robusta para reenviar con retry 
async function forwardToRestAPI(data, token) {
  let attempt = 0;
  while (attempt < 5) { // máx 5 intentos
    try {
      const response = await axios.post(process.env.REST_API_URL, data, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });
      console.log('📤 Webhook → REST API:', response.data);
      return response.data; // éxito
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        // Too Many Requests → aplicar retry-after o backoff
        const ra = err.response?.headers?.['retry-after'];
        let delay = msBackoffTry(attempt);
        if (ra) {
          const parsed = parseInt(ra, 10);
          if (!Number.isNaN(parsed)) delay = Math.max(parsed * 1000, BASE_MS);
        }
        console.warn(`⚠️ REST API respondió 429. Reintentando en ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        attempt++;
      } else {
        // Otros errores → no reintentar
        throw err;
      }
    }
  }
  throw new Error("Máximos intentos al REST API alcanzados (429 persistente).");
}

// Endpoint 
app.post('/webhook', async (req, res) => {
  console.log('📥 Webhook recibió datos:', req.body);

  // Obtener token del header 
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No se proporcionó token" });
  }

    try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }

 try {
    //función con retry/backoff
    const response = await forwardToRestAPI(req.body, token);
    res.status(200).json({ message: '✅ Webhook procesó los datos correctamente' });
  } catch (err) {
    console.error('⚠️ Error reenviando al REST API:', err.message);
    res.status(500).json({ error: 'Error al reenviar al REST API', details: err.message });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Webhook escuchando en http://localhost:${PORT}/webhook`);
});
