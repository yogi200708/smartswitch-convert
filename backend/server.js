require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const mqtt = require('mqtt');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 5000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'smartswitch2026';
const JWT_SECRET = process.env.JWT_SECRET || 'smart_switch_secret_key_jwt_2026_super_secure';
const ESP32_LOCAL_IP = process.env.ESP32_LOCAL_IP || '10.25.191.83';
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtts://broker.hivemq.com:8883';
const MQTT_TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'smartswitch/convert';

// CORS & Chrome Private Network Access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Serve frontend static build if available
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// In-Memory Cloud State
let globalState = {
  online: false,
  connectionSource: 'NONE', // 'MQTT' | 'LOCAL_BRIDGE' | 'NONE'
  relay: false,
  relayStatus: 'OFF',
  ip: ESP32_LOCAL_IP,
  wifiRSSI: -55,
  time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  timeSynced: true,
  voltage: 0.0,
  current: 0.0,
  powerVA: 0.0,
  powerW: 0.0,
  energyKWh: 0.0,
  frequencyHz: 50.0,
  powerFactor: 0.95,
  measurementType: 'live cloud stream',
  lastSeen: 0
};

// Simple secure token storage
const validTokens = new Set();
function generateToken(username) {
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.add(token);
  return token;
}

// Authentication Middleware for protected relay control
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '') || req.query.token || req.headers['x-auth-token'];
  if (token && validTokens.has(token)) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: 'Unauthorized: Valid Admin login required to control the relay'
  });
}

// WebSocket broadcast helper
function broadcastTelemetry() {
  const payload = JSON.stringify({ type: 'TELEMETRY_UPDATE', data: globalState });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  });
}

// ======================== AUTHENTICATION ENDPOINTS ========================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken(username);
    console.log(`[AUTH] Successful login for user: ${username}`);
    return res.json({
      success: true,
      token,
      username: ADMIN_USERNAME,
      message: 'Authentication successful. Access granted to relay controls.'
    });
  }
  console.warn(`[AUTH] Failed login attempt for user: ${username}`);
  return res.status(401).json({
    success: false,
    error: 'Invalid credentials. Please enter the correct admin password.'
  });
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '') || req.query.token;
  const isValid = Boolean(token && validTokens.has(token));
  return res.json({ success: isValid, authenticated: isValid });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '') || req.query.token;
  if (token) validTokens.delete(token);
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ======================== STATUS & TELEMETRY API ========================
app.get('/api/status', (req, res) => {
  // If lastSeen was within last 12 seconds, consider online
  const isFresh = (Date.now() - globalState.lastSeen) < 12000;
  res.json({
    online: isFresh && globalState.online,
    relay: globalState.relay,
    relayStatus: globalState.relayStatus,
    ip: globalState.ip,
    wifiRSSI: globalState.wifiRSSI,
    time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    timeSynced: true,
    connectionSource: globalState.connectionSource,
    mqttConnected: mqttClient?.connected ?? false
  });
});

app.get('/api/data', (req, res) => {
  res.json({
    voltage: globalState.voltage,
    current: globalState.current,
    powerVA: globalState.powerVA,
    powerW: globalState.powerW,
    energyKWh: globalState.energyKWh,
    frequencyHz: globalState.frequencyHz,
    powerFactor: globalState.powerFactor,
    measurementType: globalState.measurementType,
    relay: globalState.relay
  });
});

// ======================== RELAY CONTROL (SECURED) ========================
app.get('/api/relay/on', requireAuth, async (req, res) => {
  await executeRelaySwitch(true);
  res.json({ success: true, relay: true, relayStatus: 'ON' });
});

app.get('/api/relay/off', requireAuth, async (req, res) => {
  await executeRelaySwitch(false);
  res.json({ success: true, relay: false, relayStatus: 'OFF' });
});

app.post('/api/control/relay', requireAuth, async (req, res) => {
  const { state } = req.body;
  const targetState = Boolean(state);
  await executeRelaySwitch(targetState);
  res.json({ success: true, relay: targetState, relayStatus: targetState ? 'ON' : 'OFF' });
});

async function executeRelaySwitch(targetState) {
  globalState.relay = targetState;
  globalState.relayStatus = targetState ? 'ON' : 'OFF';

  // 1. Send via MQTT if connected
  if (mqttClient && mqttClient.connected) {
    const payload = JSON.stringify({ state: targetState ? 'ON' : 'OFF' });
    mqttClient.publish(`${MQTT_TOPIC_PREFIX}/relay/set`, payload, { qos: 1 });
    console.log(`[MQTT] Published relay command to ${MQTT_TOPIC_PREFIX}/relay/set: ${payload}`);
  }

  // 2. Also forward to local ESP32 bridge if reachable
  if (ESP32_LOCAL_IP) {
    try {
      const endpoint = targetState ? 'on' : 'off';
      await fetch(`http://${ESP32_LOCAL_IP}/api/relay/${endpoint}`, { signal: AbortSignal.timeout(1500) });
      console.log(`[BRIDGE] Forwarded relay ${endpoint} to http://${ESP32_LOCAL_IP}`);
    } catch (e) {
      // Local bridge might be offline if ESP32 is remote, that's fine
    }
  }

  broadcastTelemetry();
}

// ======================== LOCAL LAN BRIDGE LOOP ========================
// Keeps polling local ESP32 (10.25.191.83) so existing flashed ESP32 works right now!
async function pollLocalESP32() {
  if (!ESP32_LOCAL_IP) return;

  try {
    const [statusRes, dataRes] = await Promise.all([
      fetch(`http://${ESP32_LOCAL_IP}/api/status`, { signal: AbortSignal.timeout(2000) }),
      fetch(`http://${ESP32_LOCAL_IP}/api/data`, { signal: AbortSignal.timeout(2000) })
    ]);

    if (statusRes.ok && dataRes.ok) {
      const statusJson = await statusRes.json();
      const dataJson = await dataRes.json();

      globalState.online = true;
      globalState.connectionSource = 'LOCAL_BRIDGE';
      globalState.lastSeen = Date.now();
      globalState.relay = statusJson.relayStatus === 'ON' || Boolean(statusJson.relay);
      globalState.relayStatus = statusJson.relayStatus || (globalState.relay ? 'ON' : 'OFF');
      globalState.ip = statusJson.ip || ESP32_LOCAL_IP;
      globalState.wifiRSSI = statusJson.wifiRSSI != null ? statusJson.wifiRSSI : globalState.wifiRSSI;

      if (dataJson) {
        globalState.voltage = Number(dataJson.voltage) || 0.0;
        globalState.current = Number(dataJson.current) || 0.0;
        globalState.powerVA = Number(dataJson.powerVA) || 0.0;
        globalState.powerW = dataJson.powerW != null ? Number(dataJson.powerW) : globalState.powerVA;
        globalState.energyKWh = Number(dataJson.energyKWh) || 0.0;
        globalState.frequencyHz = Number(dataJson.frequencyHz) || 50.0;
        globalState.powerFactor = Number(dataJson.powerFactor) || 0.95;
        globalState.measurementType = dataJson.measurementType || 'measured';
      }

      broadcastTelemetry();
    }
  } catch (err) {
    // If MQTT is also not reporting, mark as offline after timeout
    if (globalState.connectionSource === 'LOCAL_BRIDGE' && (Date.now() - globalState.lastSeen) > 8000) {
      globalState.online = false;
    }
  }
}

// Poll local ESP32 every 2.5 seconds
setInterval(pollLocalESP32, 2500);

// ======================== MQTT OVER TLS CLIENT ========================
let mqttClient = null;
if (process.env.MQTT_ENABLED !== 'false') {
  console.log(`[MQTT] Connecting to secure broker: ${MQTT_BROKER_URL}...`);
  try {
    mqttClient = mqtt.connect(MQTT_BROKER_URL, {
      clientId: `SmartSwitchServer_${crypto.randomBytes(4).toString('hex')}`,
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 5000,
      rejectUnauthorized: false // allows self-signed/public certs
    });

    mqttClient.on('connect', () => {
      console.log(`[MQTT] Successfully connected to cloud broker over TLS!`);
      // Subscribe to topics
      mqttClient.subscribe(`${MQTT_TOPIC_PREFIX}/telemetry`, { qos: 1 });
      mqttClient.subscribe(`${MQTT_TOPIC_PREFIX}/status`, { qos: 1 });
      mqttClient.subscribe(`${MQTT_TOPIC_PREFIX}/relay/status`, { qos: 1 });
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const text = message.toString();
        const payload = JSON.parse(text);

        if (topic.endsWith('/telemetry')) {
          globalState.online = true;
          globalState.connectionSource = 'MQTT_TLS';
          globalState.lastSeen = Date.now();
          if (payload.voltage != null) globalState.voltage = Number(payload.voltage);
          if (payload.current != null) globalState.current = Number(payload.current);
          if (payload.power != null) globalState.powerW = Number(payload.power);
          if (payload.powerVA != null) globalState.powerVA = Number(payload.powerVA);
          if (payload.energy != null) globalState.energyKWh = Number(payload.energy);
          if (payload.frequency != null) globalState.frequencyHz = Number(payload.frequency);
          if (payload.power_factor != null) globalState.powerFactor = Number(payload.power_factor);
          if (payload.relay !== undefined) {
            globalState.relay = Boolean(payload.relay);
            globalState.relayStatus = globalState.relay ? 'ON' : 'OFF';
          }
          if (payload.wifi_rssi != null) globalState.wifiRSSI = payload.wifi_rssi;
          if (payload.ip) globalState.ip = payload.ip;
          broadcastTelemetry();
        } else if (topic.endsWith('/relay/status')) {
          const isRelayOn = payload.state === 'ON' || payload.relay === true;
          globalState.relay = isRelayOn;
          globalState.relayStatus = isRelayOn ? 'ON' : 'OFF';
          globalState.lastSeen = Date.now();
          broadcastTelemetry();
        } else if (topic.endsWith('/status')) {
          globalState.online = (payload.status === 'ONLINE' || payload.status === 'online');
          globalState.lastSeen = Date.now();
          broadcastTelemetry();
        }
      } catch (err) {
        console.error('[MQTT] Message parsing error:', err.message);
      }
    });

    mqttClient.on('error', (err) => {
      console.warn('[MQTT] Connection warning:', err.message);
    });
  } catch (err) {
    console.error('[MQTT] Failed to initialize MQTT:', err.message);
  }
}

// Universal Proxy Route for legacy compatibility
app.all('/api/proxy', async (req, res) => {
  const targetIp = req.query.ip || req.body?.ip || ESP32_LOCAL_IP;
  const targetPath = req.query.path || '/api/status';
  const targetMethod = req.method === 'POST' && req.body?.method ? req.body.method : req.method;
  let cleanHost = targetIp.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const url = `http://${cleanHost}${targetPath.startsWith('/') ? '' : '/'}${targetPath}`;

  try {
    const response = await fetch(url, {
      method: targetMethod,
      headers: { 'Accept': 'application/json, text/plain, */*' },
      signal: AbortSignal.timeout(3000)
    });
    const data = await response.json().catch(async () => ({ raw: await response.text() }));
    return res.status(response.status).json({ success: response.ok, status: response.status, data });
  } catch (err) {
    return res.status(504).json({ success: false, error: err.message, ip: cleanHost });
  }
});

// For any other route, serve index.html (SPA client-side routing)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('SMART SWITCH CONVERT API Server Running. Build frontend to view dashboard.');
    }
  });
});

// WebSocket Connection Management
wss.on('connection', (ws) => {
  // Send current state immediately on connect
  ws.send(JSON.stringify({ type: 'INITIAL_STATE', data: globalState }));

  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message.toString());
      if (msg.type === 'TOGGLE_RELAY') {
        // Check token
        if (!validTokens.has(msg.token)) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Unauthorized: Admin login required' }));
          return;
        }
        await executeRelaySwitch(Boolean(msg.state));
      }
    } catch (e) {
      console.error('[WS] Error processing message:', e.message);
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  SMART SWITCH CONVERT - Cloud IoT Gateway`);
  console.log(`  Web & REST API: http://localhost:${PORT}`);
  console.log(`  Local ESP32 Bridge: http://${ESP32_LOCAL_IP}`);
  console.log(`  MQTT over TLS: ${MQTT_BROKER_URL}`);
  console.log(`  Admin Username: ${ADMIN_USERNAME}`);
  console.log(`  Admin Password: ${ADMIN_PASSWORD}`);
  console.log(`  Timezone: Asia/Kolkata (IST)`);
  console.log(`====================================================`);
});
