//WS-CLIENT
require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');
const http = require('http');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3001;
// URL del WebSocket Server y Webhook
const WS_SERVER_URL = process.env.WS_SERVER_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;


const server = http.createServer((req, res) => {
  // Health 
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => console.log(`🟢 ws-client corriendo en puerto ${PORT}`));

// JWT del usuario 
function getToken() {
  return jwt.sign({ user: "ws-client" }, process.env.JWT_SECRET, { expiresIn: "20d" });
}

const token = getToken();

// Ciudades a medir con sus coordenadas
const cities = [
  { name: 'Shangai', lat: 31.2304, lon: 121.4737 },
  { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
  { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 }
];

// Función que consulta la API de Open-Meteo
async function fetchTemperatures() {
  const timestamp = new Date().toISOString();

  const requests = cities.map(async (city) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`;
      const response = await axios.get(url);
      const temperature = response.data.current_weather.temperature;

      return { city: city.name, temperature, timestamp };
    } catch (err) {
      console.error(`⚠️ Error obteniendo datos de ${city.name}:`, err.message);
      return null;
    }
  });

  const results = await Promise.all(requests);
  return results.filter(r => r !== null);
}
//  Backoff exponencial con jitter (ERROR 429)
const BASE_MS = 1000;   // 1s
const MAX_MS  = 60_000; // 60s
let attempt = 0;        // contador de intentos
let ws;
let dataInterval = null;
let reconnectTimer = null;
let connecting = false;

function msBackoffTry(n) {
  const exp = Math.min(MAX_MS, BASE_MS * Math.pow(2, n));
  return Math.round(exp * (0.5 + Math.random())); // jitter
}

function clearTimers() {
  if (dataInterval) { clearInterval(dataInterval); dataInterval = null; }
}

function scheduleReconnect(delayMs) {
  if (reconnectTimer) return; // evita múltiples timers
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWS();
  }, delayMs);
  console.log(`⏳ Reintentando en ${Math.round(delayMs/1000)}s...`);
}

//  FUNCIÓN PRINCIPAL DE CONEXIÓN
function connectWS() {
  if (connecting) return;
  connecting = true;
  attempt++;
  console.log(`🔌 Conectando a ${WS_SERVER_URL} (intento ${attempt})...`);

  ws = new WebSocket(WS_SERVER_URL, {
    handshakeTimeout: 15000,
    perMessageDeflate: false,
   
  });

  //  Manejo de 429 y otros errores de handshake 
  ws.on('unexpected-response', (req, res) => {
    const sc = res.statusCode;
    const ra = res.headers['retry-after'];
    console.error(`🟥 Handshake inesperado: ${sc}. Retry-After: ${ra ?? 'N/A'}`);

    let body = '';
    res.on('data', chunk => body += chunk.toString());
    res.on('end', () => {
      if (body) console.error(`↪️ Body: ${body.slice(0, 200)}`);
    });

    try { ws.close(); } catch {}
    clearTimers();

    let delay = msBackoffTry(attempt);
    if (sc === 429 && ra) {
      const parsed = parseInt(ra, 10);
      if (!Number.isNaN(parsed)) delay = Math.max(parsed * 1000, BASE_MS);
    }
    connecting = false;
    scheduleReconnect(delay);
  });

  // Conexión abierta 
  ws.on('open', () => {
    console.log('✅ Conectado al WS Server');
    attempt = 0; // reset intentos
    connecting = false;

    // Cada 30 minutos → consulta real
    dataInterval = setInterval(async () => {
      const tempData = await fetchTemperatures();
      if (tempData.length > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(tempData));
        console.log('📤 Enviado al WS Server:', tempData);

        // También al webhook con JWT
        try {
          await axios.post(WEBHOOK_URL, tempData, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000
          });
          console.log('📤 Datos enviados al Webhook');
        } catch (error) {
          console.error('⚠️ Error al enviar al Webhook:', error.message);
        }
      }
    }, 1800000);
  });

  // Mensajes recibidos 
  ws.on('message', (msg) => {
    console.log('📥 Mensaje del WS Server:', msg.toString());
  });

  // Cierre de conexión 
  ws.on('close', (code, reason) => {
    console.warn(`🔒 Conexión cerrada (${code}) ${reason?.toString?.() || ''}`);
    clearTimers();
    connecting = false;
    scheduleReconnect(msBackoffTry(attempt));
  });

  // Errores 
  ws.on('error', (err) => {
    console.error('🟥 WS error:', err?.message || err);
   
  });
}

// Iniciar
connectWS();