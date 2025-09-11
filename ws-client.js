/* // ws-client.js aleatoriooo
const WebSocket = require('ws'); // importa la librería para usar WebSocket

// URL del WebSocket Server al que vamos a conectarnos
const WS_SERVER_URL = 'ws://localhost:8088'; // si tu server tiene otro puerto, cambialo aquí

// Ciudades que vamos a medir
const cities = ['Shangai', 'Berlin', 'Rio de Janeiro'];

// Devuelve una temperatura entre -5°C y 40°C
function getRandomTemperature() {
  return (Math.random() * 45 - 5).toFixed(1); // .toFixed(1) da un decimal
}

function generateTemperatureData() {
  const timestamp = new Date().toISOString(); // fecha en UTC
  const data = cities.map(city => ({
    city,
    temperature: Number(getRandomTemperature()), // temperatura aleatoria
    timestamp
  }));
  return data;
}

const ws = new WebSocket(WS_SERVER_URL);

ws.on('open', () => {
  console.log('✅ Conectado al WebSocket Server');

  // Enviar datos cada 5 segundos
  setInterval(() => {
    const tempData = generateTemperatureData();
    ws.send(JSON.stringify(tempData)); // enviamos como JSON
    console.log('📤 Enviado:', tempData);
  }, 5000);
});

ws.on('message', (message) => {
  console.log('📥 Mensaje del server:', message.toString());
});

ws.on('close', () => {
  console.log('❌ Conexión cerrada');
});

ws.on('error', (err) => {
  console.error('⚠️ Error en WebSocket:', err.message);
});
 */
//aleatorioo prueba 2
/* 
const WebSocket = require('ws');

const WS_SERVER_URL = 'ws://localhost:8088';
const cities = ['Shangai', 'Berlin', 'Rio de Janeiro'];

function getRandomTemperature() {
  return (Math.random() * 45 - 5).toFixed(1);
}

function generateTemperatureData() {
  const timestamp = new Date().toISOString();
  return cities.map(city => ({
    city,
    temperature: Number(getRandomTemperature()),
    timestamp
  }));
}

const ws = new WebSocket(WS_SERVER_URL);

ws.on('open', () => {
  console.log('✅ Conectado al WebSocket Server');

  setInterval(() => {
    const tempData = generateTemperatureData();
    ws.send(JSON.stringify(tempData));
    console.log('📤 Enviado:', tempData);
  }, 5000);
});

ws.on('message', (message) => {
  console.log('📥 Mensaje del server:', message.toString());
});

ws.on('close', () => console.log('❌ Conexión cerrada'));
ws.on('error', (err) => console.error('⚠️ Error en WebSocket:', err.message));
 */

/* // ws-client.js con api open-meteo
require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');

 // URL de tu WebSocket Server
const WS_SERVER_URL = process.env.WS_SERVER_URL; 
// Detectar si estamos en Render o en local
/* const WS_SERVER_URL = process.env.RENDER
  ? process.env.WS_SERVER_URL  // URL pública en Render
  : 'ws://localhost:8088';     // URL local para pruebas */

// Ciudades a medir con sus coordenadas
/* const cities = [
  { name: 'Shangai', lat: 31.2304, lon: 121.4737 },
  { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
  { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 }
];

// Función que consulta la API de Open-Meteo
async function fetchTemperatures() {
  const timestamp = new Date().toISOString();

  // Mapeamos cada ciudad a una promesa de consulta
  const requests = cities.map(async (city) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`;
      const response = await axios.get(url);
      const temperature = response.data.current_weather.temperature;

      return {
        city: city.name,
        temperature,
        timestamp
      };
    } catch (err) {
      console.error(`⚠️ Error obteniendo datos de ${city.name}:`, err.message);
      return null;
    }
  });

  // Esperamos todas las consultas y filtramos errores
  const results = await Promise.all(requests);
  return results.filter(r => r !== null);
}

// Conectamos al WebSocket Server
const ws = new WebSocket(WS_SERVER_URL);

ws.on('open', () => {
  console.log('✅ Conectado al WebSocket Server');

  // Cada 30 minutos (1800000 ms) → consulta real
  setInterval(async () => {
    const tempData = await fetchTemperatures();
    if (tempData.length > 0) {
      ws.send(JSON.stringify(tempData));
      console.log('📤 Enviado:', tempData);
    }
  }, 1800000); // ⚠️ para pruebas podés bajarlo a 5000 ms y después volver a 1800000
});

ws.on('message', (message) => {
  console.log('📥 Mensaje del server:', message.toString());
});

ws.on('close', () => console.log('❌ Conexión cerrada'));
ws.on('error', (err) => console.error('⚠️ Error en WebSocket:', err.message)); */

/* //MODD RENDERR
require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');
const http = require('http');

// Usamos el puerto que Render asigna, o un puerto local para pruebas
const PORT = process.env.PORT || 3001;

// Creamos un server HTTP mínimo para que Render acepte el servicio
const server = http.createServer();
server.listen(PORT, () => console.log(`🟢 ws-client corriendo en puerto ${PORT}`));

// URL del WebSocket Server y Webhook
const WS_SERVER_URL = process.env.WS_SERVER_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

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

// Conectamos al WebSocket Server
const ws = new WebSocket(WS_SERVER_URL);

ws.on('open', () => {
  console.log('✅ Conectado al WS Server');

  // Cada 30 minutos (1800000 ms) → consulta real
  setInterval(async () => {
    const tempData = await fetchTemperatures();
    if (tempData.length > 0) {
      ws.send(JSON.stringify(tempData));
      console.log('📤 Enviado:', tempData);

      // También al Webhook
      try {
        await axios.post(WEBHOOK_URL, tempData);
        console.log('📤 Datos enviados al Webhook');
      } catch (error) {
        console.error('⚠️ Error al enviar al Webhook:', error.message);
      }
    }
  }, 1800000); // ⚠️ Para pruebas podés poner 5000 ms
});

/* ws.on('message', (message) => console.log('📥 Mensaje del WS Server:', message.toString()));
ws.on('close', () => console.log('❌ Conexión cerrada'));
ws.on('error', (err) => console.error('⚠️ Error en WS:', err.message)); */
 
/* //con pinggg 
// ws-client.js
require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');
const http = require('http');

// Usamos el puerto que Render asigna, o un puerto local para pruebas
const PORT = process.env.PORT || 3001;

// Creamos un server HTTP mínimo para que Render acepte el servicio
const server = http.createServer((req, res) => {
  // Health check
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => console.log(`🟢 ws-client corriendo en puerto ${PORT}`));

// URL del WebSocket Server y Webhook
const WS_SERVER_URL = process.env.WS_SERVER_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

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

// ==== FUNCIÓN PRINCIPAL DE CONEXIÓN WS ====
function connectWS() {
  const ws = new WebSocket(WS_SERVER_URL);

  ws.on('open', () => {
    console.log('✅ Conectado al WS Server');

    // 🔄 Keep-alive: cada 25 segundos manda un ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
        console.log('🔄 Ping enviado para mantener la conexión viva');
      }
    }, 25000);

    ws.on('pong', () => {
      console.log('✅ Pong recibido (conexión viva)');
    });

    // Cada 30 minutos (1800000 ms) → consulta real
    const dataInterval = setInterval(async () => {
      const tempData = await fetchTemperatures();
      if (tempData.length > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(tempData));
        console.log('📤 Enviado al WS Server:', tempData);

        // También al Webhook
        try {
          await axios.post(WEBHOOK_URL, tempData);
          console.log('📤 Datos enviados al Webhook');
        } catch (error) {
          console.error('⚠️ Error al enviar al Webhook:', error.message);
        }
      }
    }, 1800000); // ⚠️ Para pruebas podés usar 5000 ms

    ws.on('close', () => {
      console.log('❌ Conexión cerrada, reintentando en 5s...');
      clearInterval(pingInterval);
      clearInterval(dataInterval);
      setTimeout(connectWS, 5000);
    });

    ws.on('error', (err) => {
      console.error('⚠️ Error en WS:', err.message);
    });
  });

  ws.on('message', (message) => {
    console.log('📥 Mensaje del WS Server:', message.toString());
  });
}

// 🚀 Iniciar conexión
connectWS(); */

//con jwt y sin ping 
require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');
const http = require('http');
const jwt = require('jsonwebtoken');

// Usamos el puerto que Render asigna, o un puerto local para pruebas
const PORT = process.env.PORT || 3001;
// URL del WebSocket Server y Webhook
const WS_SERVER_URL = process.env.WS_SERVER_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Creamos un server HTTP mínimo para que Render acepte el servicio
const server = http.createServer((req, res) => {
  // Health check
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => console.log(`🟢 ws-client corriendo en puerto ${PORT}`));



// JWT del usuario (dummy login)
function getToken() {
  // Aquí podés reemplazar por login real a tu REST API
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
// 🔧 Backoff exponencial con jitter
// ==============================
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
/* 
// ==== FUNCIÓN PRINCIPAL DE CONEXIÓN WS ====
function connectWS() {
  const ws = new WebSocket(WS_SERVER_URL);

  ws.on('open', () => {
    console.log('✅ Conectado al WS Server');

    // Cada 30 minutos (1800000 ms) → consulta real
    const dataInterval = setInterval(async () => {
      const tempData = await fetchTemperatures();
      if (tempData.length > 0 && ws.readyState === WebSocket.OPEN) {
        // Enviar al WS Server
        ws.send(JSON.stringify(tempData));
        console.log('📤 Enviado al WS Server:', tempData);

        // También al Webhook con JWT en header
        try {
          await axios.post(WEBHOOK_URL, tempData, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log('📤 Datos enviados al Webhook');
        } catch (error) {
          console.error('⚠️ Error al enviar al Webhook:', error.message);
        }
      }
    }, 1800000); // ⚠️ Para pruebas podés usar 5000 ms

    ws.on('close', () => {
      console.log('❌ Conexión cerrada, reintentando en 5s...');
      clearInterval(dataInterval);
      setTimeout(connectWS, 5000);
    });

    ws.on('error', (err) => {
      console.error('⚠️ Error en WS:', err.message);
    });
  });

  ws.on('message', (message) => {
    console.log('📥 Mensaje del WS Server:', message.toString());
  });
}

// 🚀 Iniciar conexión
connectWS();
 */

// ==============================
// 🔌 FUNCIÓN PRINCIPAL DE CONEXIÓN
// ==============================
function connectWS() {
  if (connecting) return;
  connecting = true;
  attempt++;
  console.log(`🔌 Conectando a ${WS_SERVER_URL} (intento ${attempt})...`);

  ws = new WebSocket(WS_SERVER_URL, {
    handshakeTimeout: 15000,
    perMessageDeflate: false,
    // headers: { Authorization: `Bearer ${token}` } // si tu server WS lo requiere
  });

  // --- Manejo de 429 y otros errores de handshake ---
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

  // --- Conexión abierta ---
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
    }, 1800000); // ⚠️ para pruebas bajalo a 5000 ms
  });

  // --- Mensajes recibidos ---
  ws.on('message', (msg) => {
    console.log('📥 Mensaje del WS Server:', msg.toString());
  });

  // --- Cierre de conexión ---
  ws.on('close', (code, reason) => {
    console.warn(`🔒 Conexión cerrada (${code}) ${reason?.toString?.() || ''}`);
    clearTimers();
    connecting = false;
    scheduleReconnect(msBackoffTry(attempt));
  });

  // --- Errores ---
  ws.on('error', (err) => {
    console.error('🟥 WS error:', err?.message || err);
    // No reconectamos acá; el "close" o "unexpected-response" se encargan
  });
}

// 🚀 Iniciar
connectWS();