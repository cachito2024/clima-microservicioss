/* const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DATA_FILE = path.join(__dirname, 'temperaturas.json');

const wss = new WebSocket.Server({ port: 8088 }, () => {
  console.log('✅ WebSocket Server corriendo en ws://localhost:8088');
});

wss.on('connection', (ws) => {
  console.log('🔗 Cliente conectado');

  ws.on('message', async (message) => {
    console.log('📥 Datos recibidos del cliente:', message.toString());

    // Parseamos el JSON que llega del cliente
    let newData;
    try {
      newData = JSON.parse(message.toString());
    } catch (err) {
      console.error('⚠️ Error parseando JSON:', err);
      return;
    }

    // Guardar localmente en archivo
    let fileData = [];
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE);
      fileData = JSON.parse(raw);
    }
    fileData.push(...newData);
    fs.writeFileSync(DATA_FILE, JSON.stringify(fileData, null, 2));
    console.log('💾 Datos guardados temporalmente en temperaturas.json');

    // Reenviar al webhook (punto 3)
    try {
      await axios.post('http://localhost:3000/webhook', newData);
      console.log('📤 Datos reenviados al Webhook (punto 3)');
    } catch (error) {
      console.error('⚠️ Error al enviar al Webhook:', error.message);
    }

    // Responder al cliente WS
    ws.send('✅ Datos procesados y enviados al webhook');
  });

  ws.on('close', () => {
    console.log('❌ Cliente desconectado');
  });
});
 */
/* require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');

const WS_PORT = 8088;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`✅ WebSocket Server corriendo en ws://localhost:${WS_PORT}`);
});

wss.on('connection', (ws) => {
  console.log('🔗 Cliente conectado');

  ws.on('message', async (message) => {
    console.log('📥 Datos recibidos del cliente:', message.toString());

    let newData;
    try {
      newData = JSON.parse(message.toString());
    } catch (err) {
      console.error('⚠️ Error parseando JSON:', err);
      return;
    }

    // Reenviar directamente al Webhook
    try {
      await axios.post(WEBHOOK_URL, newData);
      console.log('📤 Datos reenviados al Webhook');
      ws.send('✅ Datos enviados correctamente al Webhook');
    } catch (error) {
      console.error('⚠️ Error al enviar al Webhook:', error.message);
      ws.send('⚠️ Error al enviar al Webhook');
    }
  });

  ws.on('close', () => {
    console.log('❌ Cliente desconectado');
  });
});
 */
//MODIF RENDER.. 
/* require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');
const express = require('express');

const app = express();

// Health check para Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Usar el puerto que Render asigna
const PORT = process.env.PORT || 8088;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Crear servidor HTTP a partir de Express
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor HTTP corriendo en http://localhost:${PORT}`);
});

// Crear WebSocket usando el mismo servidor
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔗 Cliente conectado');

  ws.on('message', async (message) => {
    console.log('📥 Datos recibidos del cliente:', message.toString());

    let newData;
    try {
      newData = JSON.parse(message.toString());
    } catch (err) {
      console.error('⚠️ Error parseando JSON:', err);
      return;
    }

    // Reenviar directamente al Webhook
    try {
      await axios.post(WEBHOOK_URL, newData);
      console.log('📤 Datos reenviados al Webhook');
      ws.send('✅ Datos enviados correctamente al Webhook');
    } catch (error) {
      console.error('⚠️ Error al enviar al Webhook:', error.message);
      ws.send('⚠️ Error al enviar al Webhook');
    }
  });

  ws.on('close', () => {
    console.log('❌ Cliente desconectado');
  });
});
 */

/* // CON JWT
require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();

// Health check para Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Usar el puerto que Render asigna
const PORT = process.env.PORT || 8088;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Crear servidor HTTP a partir de Express
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor HTTP corriendo en http://localhost:${PORT}`);
});

// Crear WebSocket usando el mismo servidor
const wss = new WebSocket.Server({ server });

// ====== Función para validar JWT ======
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

wss.on('connection', (ws, req) => {
  console.log('🔗 Cliente conectado');

  // Se espera que el cliente envíe el token en el primer mensaje o en un header custom
  ws.isAuthenticated = false;

  ws.on('message', async (message) => {
    let parsed;
    try {
      parsed = JSON.parse(message.toString());
    } catch (err) {
      console.error('⚠️ Error parseando JSON:', err);
      return;
    }

    // Si aún no está autenticado, busca token
    if (!ws.isAuthenticated) {
      if (!parsed.token) {
        ws.send('⚠️ No se proporcionó token. Conexión rechazada.');
        ws.close();
        return;
      }
      const user = verifyToken(parsed.token);
      if (!user) {
        ws.send('⚠️ Token inválido. Conexión cerrada.');
        ws.close();
        return;
      }
      ws.isAuthenticated = true;
      ws.user = user;
      ws.send('✅ Autenticación exitosa. Ya podés enviar datos.');
      return;
    }

    // Resto de mensajes (datos de temperatura)
    try {
      await axios.post(WEBHOOK_URL, parsed, {
        headers: {
          Authorization: `Bearer ${parsed.token}` // reenviamos token si querés
        }
      });
      console.log('📤 Datos reenviados al Webhook:', parsed);
      ws.send('✅ Datos enviados correctamente al Webhook');
    } catch (error) {
      console.error('⚠️ Error al enviar al Webhook:', error.message);
      ws.send('⚠️ Error al enviar al Webhook');
    }
  });

  ws.on('close', () => {
    console.log('❌ Cliente desconectado');
  });
});
 */

//DIO MMISAA 
// ====== WS-SERVER CON JWT + LIMITES DE CONEXIÓN ======
require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();

// Health check para Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Puerto asignado por Render o local
const PORT = process.env.PORT || 8088;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Crear servidor HTTP
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor HTTP corriendo en http://localhost:${PORT} (instancia: ${process.env.RENDER_INSTANCE_ID || 'local'})`);
});

// Crear WebSocket sobre el mismo servidor HTTP
const wss = new WebSocket.Server({ server });

// ====== Función para validar JWT ======
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// ====== Anti-flood: controlar conexiones por IP ======
const connCountByIp = new Map();
const MAX_CONN_PER_IP = 5;

wss.on('connection', (ws, req) => {
  // Detectar IP real (si Render agrega cabecera x-forwarded-for)
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const curr = (connCountByIp.get(ip) || 0) + 1;
  connCountByIp.set(ip, curr);

  if (curr > MAX_CONN_PER_IP) {
    // ❌ Demasiadas conexiones desde la misma IP → cerrar
    try { ws.close(1013, 'Too many connections from same IP'); } catch {}
    connCountByIp.set(ip, curr - 1);
    return;
  }

  console.log(`🔗 Cliente conectado (${ip}), conexiones activas IP=${curr}`);

  // ====== KeepAlive para que Render/Proxy no cierre el WS ======
  const keepAlive = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.ping(); } catch {}
    }
  }, 30_000);

  ws.on('pong', () => { /* opcional, confirma que el cliente responde */ });

  // ====== Estado de autenticación por cliente ======
  ws.isAuthenticated = false;

  ws.on('message', async (message) => {
    let parsed;
    try {
      parsed = JSON.parse(message.toString());
    } catch (err) {
      console.error('⚠️ Error parseando JSON:', err);
      ws.send('⚠️ Mensaje no es JSON válido.');
      return;
    }

    // ====== Primer mensaje debe traer token para autenticación ======
    if (!ws.isAuthenticated) {
      if (!parsed.token) {
        ws.send('⚠️ No se proporcionó token. Conexión rechazada.');
        ws.close();
        return;
      }
      const user = verifyToken(parsed.token);
      if (!user) {
        ws.send('⚠️ Token inválido. Conexión cerrada.');
        ws.close();
        return;
      }
      ws.isAuthenticated = true;
      ws.user = user;
      ws.send('✅ Autenticación exitosa. Ya podés enviar datos.');
      return;
    }

    // ====== Si ya está autenticado, reenviar datos al webhook ======
    if (!WEBHOOK_URL) {
      ws.send('⚠️ WEBHOOK_URL no configurado');
      return;
    }

    try {
      await axios.post(WEBHOOK_URL, parsed, {
        headers: { Authorization: `Bearer ${parsed.token}` },
        timeout: 15000
      });
      console.log('📤 Datos reenviados al Webhook:', parsed);
      ws.send('✅ Datos enviados correctamente al Webhook');
    } catch (error) {
      console.error('⚠️ Error al enviar al Webhook:', error.message);
      ws.send('⚠️ Error al enviar al Webhook');
    }
  });

  ws.on('close', () => {
    clearInterval(keepAlive);
    // Actualizar contador de conexiones por IP
    const left = (connCountByIp.get(ip) || 1) - 1;
    if (left <= 0) connCountByIp.delete(ip);
    else connCountByIp.set(ip, left);
    console.log(`❌ Cliente desconectado (${ip}), conexiones activas IP=${Math.max(left, 0)}`);
  });

  ws.on('error', (err) => {
    console.error('🟥 WS server error:', err?.message || err);
  });
});
