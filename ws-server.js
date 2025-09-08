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
require('dotenv').config();
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
