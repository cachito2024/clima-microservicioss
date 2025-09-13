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

//Función para validar JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Anti-flood: controlar conexiones por IP 
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

  //KeepAlive para que Render/Proxy no cierre el WS 
  const keepAlive = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.ping(); } catch {}
    }
  }, 30_000);

  ws.on('pong', () => {  });

  // Estado de autenticación por cliente 
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

    // Primer mensaje debe traer token para autenticación
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

    // Si ya está autenticado, reenviar datos al webhook 
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
