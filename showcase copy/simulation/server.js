/**
 * =========================================================================
 * READER PROTOCOL SERVER — INTEGRATED SIMULATION RELAY & DATABASE
 * =========================================================================
 * Serves the Field Receiver, Handheld Reader (Water & Sand), Archival Log,
 * and Repair interfaces. Manages multi-client WebSocket sync, automatic
 * username generation, live feed telemetry, and persistent JSON database.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8787);
const DB_FILE = path.join(__dirname, 'data', 'logs.json');

// Ensure database file exists
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, '[]', 'utf8');
}

// -------------------------------------------------------------------------
// DATABASE HELPERS
// -------------------------------------------------------------------------
function getLogs() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('[DB] Error reading logs:', e);
    return [];
  }
}

function saveLog(newEntry) {
  try {
    const logs = getLogs();
    logs.unshift(newEntry); // Newest first
    fs.writeFileSync(DB_FILE, JSON.stringify(logs, null, 2), 'utf8');
    console.log(`[DB] Log saved: ${newEntry.id} by [${newEntry.username}]`);
    return logs;
  } catch (e) {
    console.error('[DB] Error saving log:', e);
    return [];
  }
}

// -------------------------------------------------------------------------
// USERNAME GENERATOR BASED ON ELEMENT
// -------------------------------------------------------------------------
const WATER_PREFIXES = ['Tide', 'Current', 'Silt', 'Abyss', 'Wave', 'Reef', 'Basin', 'Deep'];
const SAND_PREFIXES = ['Dune', 'Grain', 'Quartz', 'Strata', 'Drift', 'Arid', 'Sift', 'Ridge'];

function generateUsername(element = 'WATER') {
  const isSand = String(element).toUpperCase() === 'SAND';
  const list = isSand ? SAND_PREFIXES : WATER_PREFIXES;
  const prefix = list[Math.floor(Math.random() * list.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

// -------------------------------------------------------------------------
// SCENARIO METADATA
// -------------------------------------------------------------------------
const laptopText = {
  WATER: {
    title: 'FIELD 01 / WATER',
    instruction: 'FOLLOW THE CURRENT',
    explanation: 'Adjust the Reader until the submerged signal settles. Do not assume the first sound is the message.',
    scene: 'A shallow body of water covers the remains of a settlement. Something beneath the surface is still carrying a signal.'
  },
  SAND: {
    title: 'FIELD 02 / SAND',
    instruction: 'FOLLOW THE RESIDUE',
    explanation: 'Sweep the Reader through the residue. Attend to what becomes distinct rather than what becomes loud.',
    scene: 'Wind has exposed part of an old structure. Fine material keeps shifting around something that should not be there.'
  }
};

let globalState = {
  element: 'WATER',
  freq: 440,
  band: 120,
  listening: false,
  observation: '',
  lastGemma: ''
};

// Connected client registry
const clients = new Set();

function getClientsList() {
  const list = [];
  for (const ws of clients) {
    if (ws.readyState === 1) {
      list.push({
        id: ws.clientId,
        role: ws.role || 'observer',
        element: ws.element || 'WATER',
        username: ws.username || 'Observer',
        freq: ws.freq || globalState.freq,
        band: ws.band || globalState.band,
        listening: Boolean(ws.listening),
        connectedAt: ws.connectedAt
      });
    }
  }
  return list;
}

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const ws of clients) {
    if (ws.readyState === 1) {
      try {
        ws.send(msg);
      } catch (err) {
        console.error('[WS] Send error:', err);
      }
    }
  }
}

function broadcastClientsUpdate() {
  broadcast({
    type: 'CLIENTS_UPDATE',
    clients: getClientsList()
  });
}

// -------------------------------------------------------------------------
// HTTP SERVER & MIME CONFIG
// -------------------------------------------------------------------------
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;

  // CORS headers for local multi-device testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // -----------------------------------------------------------------------
  // REST API ENDPOINTS
  // -----------------------------------------------------------------------
  if (pathname === '/api/logs') {
    if (req.method === 'GET') {
      const logs = getLogs();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(logs));
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const entry = JSON.parse(body);
          if (!entry.id) entry.id = `log-${Date.now()}`;
          if (!entry.timestamp) entry.timestamp = new Date().toISOString();
          if (!entry.username) entry.username = generateUsername(entry.element);
          
          saveLog(entry);
          broadcast({
            type: 'FILLÁMEND_LOG',
            ...entry
          });

          res.writeHead(201, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, log: entry }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }
  }

  if (pathname === '/api/clients') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(getClientsList()));
  }

  if (pathname === '/api/stats') {
    const logs = getLogs();
    const stats = {
      totalLogs: logs.length,
      waterLogs: logs.filter(l => l.element === 'WATER').length,
      sandLogs: logs.filter(l => l.element === 'SAND').length,
      activeClients: clients.size,
      frequencyRange: [80, 1200]
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(stats));
  }

  // -----------------------------------------------------------------------
  // STATIC ROUTING
  // -----------------------------------------------------------------------
  let targetFile;

  if (pathname === '/' || pathname === '/laptop' || pathname === '/laptop/') {
    targetFile = path.join(__dirname, 'laptop', 'index.html');
  } else if (pathname === '/phone' || pathname === '/phone/') {
    targetFile = path.join(__dirname, 'phone', 'index.html');
  } else if (pathname === '/archive' || pathname === '/archive/') {
    targetFile = path.join(__dirname, 'archive', 'index.html');
  } else if (pathname === '/repair' || pathname === '/repair/') {
    targetFile = path.join(__dirname, 'repair', 'index.html');
  } else if (pathname === '/experimental' || pathname === '/experimental/') {
    targetFile = path.join(__dirname, 'experimental', 'index.html');
  } else if (pathname === '/experimental/receiver' || pathname === '/experimental/receiver/') {
    targetFile = path.join(__dirname, 'experimental', 'receiver.html');
  } else {
    // Strip leading slash
    const rel = decodeURIComponent(pathname.replace(/^\/+/, ''));
    targetFile = path.join(__dirname, rel);
  }

  const resolvedBase = path.resolve(__dirname);
  const resolvedTarget = path.resolve(targetFile);

  if (resolvedTarget !== resolvedBase && !resolvedTarget.startsWith(resolvedBase + path.sep)) {
    res.writeHead(403);
    return res.end('403 Forbidden');
  }

  fs.stat(resolvedTarget, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 File Not Found');
    }

    const ext = path.extname(resolvedTarget).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    fs.createReadStream(resolvedTarget).pipe(res);
  });
});

// -------------------------------------------------------------------------
// WEBSOCKET RELAY & REAL-TIME DISPATCH
// -------------------------------------------------------------------------
const wss = new WebSocketServer({ server, path: '/ws' });

let clientIdCounter = 1;

wss.on('connection', (ws, request) => {
  ws.clientId = `client-${clientIdCounter++}`;
  ws.connectedAt = new Date().toISOString();
  ws.element = globalState.element;
  ws.username = generateUsername(ws.element);
  ws.listening = false;
  ws.freq = globalState.freq;
  ws.band = globalState.band;

  clients.add(ws);
  console.log(`[WS] Connected: ${ws.clientId} as [${ws.username}] (${ws.element}) from ${request.socket.remoteAddress}`);

  // Send initial state & user profile to connected client
  ws.send(JSON.stringify({
    type: 'STATE',
    state: globalState,
    clientId: ws.clientId,
    username: ws.username,
    element: ws.element,
    text: laptopText[ws.element]
  }));

  // Send historical logs so new receiver clients immediately populate their frequency map
  ws.send(JSON.stringify({
    type: 'HISTORY_LOGS',
    logs: getLogs()
  }));

  broadcastClientsUpdate();

  ws.on('message', raw => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (err) {
      console.error('[WS] Parse error:', raw.toString());
      return;
    }

    // ---------------------------------------------------------------------
    // HELLO / REGISTRATION
    // ---------------------------------------------------------------------
    if (msg.type === 'HELLO') {
      ws.role = msg.role || ws.role || 'observer';
      if (msg.element) {
        ws.element = msg.element === 'SAND' ? 'SAND' : 'WATER';
      }
      if (msg.username) {
        ws.username = msg.username;
      }
      console.log(`[WS] ${ws.clientId} identified as ${ws.role} [${ws.username}] (${ws.element})`);

      ws.send(JSON.stringify({
        type: 'REGISTRATION_CONFIRMED',
        clientId: ws.clientId,
        username: ws.username,
        element: ws.element
      }));

      broadcastClientsUpdate();
      return;
    }

    // ---------------------------------------------------------------------
    // SELECT ELEMENT (WATER <-> SAND)
    // ---------------------------------------------------------------------
    if (msg.type === 'SELECT_ELEMENT') {
      const newElement = msg.element === 'SAND' ? 'SAND' : 'WATER';
      ws.element = newElement;
      globalState.element = newElement;

      // Regenerate username matching the new element if requested or default
      if (!msg.keepUsername) {
        ws.username = generateUsername(newElement);
      }

      if (msg.freq !== undefined) ws.freq = globalState.freq = Number(msg.freq);
      if (msg.band !== undefined) ws.band = globalState.band = Number(msg.band);

      console.log(`[WS] ${ws.clientId} switched element to ${newElement} (Username: [${ws.username}])`);

      broadcast({
        type: 'STATE',
        state: globalState,
        element: newElement,
        username: ws.username,
        text: laptopText[newElement]
      });

      broadcastClientsUpdate();
      return;
    }

    // ---------------------------------------------------------------------
    // TELEMETRY / STATE UPDATE
    // ---------------------------------------------------------------------
    if (msg.type === 'STATE' || msg.type === 'CONTROL') {
      if (msg.element) {
        ws.element = msg.element === 'SAND' ? 'SAND' : 'WATER';
        globalState.element = ws.element;
      }
      if (msg.frequency !== undefined) ws.freq = globalState.freq = Number(msg.frequency);
      if (msg.freq !== undefined) ws.freq = globalState.freq = Number(msg.freq);
      if (msg.band !== undefined) ws.band = globalState.band = Number(msg.band);
      if (msg.running !== undefined) ws.listening = globalState.listening = Boolean(msg.running);
      if (msg.listening !== undefined) ws.listening = globalState.listening = Boolean(msg.listening);

      broadcast({
        type: 'STATE',
        state: globalState,
        clientId: ws.clientId,
        username: ws.username,
        element: ws.element,
        frequency: ws.freq,
        band: ws.band,
        listening: ws.listening,
        text: laptopText[ws.element]
      });

      broadcastClientsUpdate();
      return;
    }

    // ---------------------------------------------------------------------
    // LISTEN / STOP
    // ---------------------------------------------------------------------
    if (msg.type === 'LISTEN') {
      ws.listening = globalState.listening = true;
      if (msg.frequency !== undefined) ws.freq = globalState.freq = Number(msg.frequency);
      if (msg.band !== undefined) ws.band = globalState.band = Number(msg.band);

      console.log(`[WS] [${ws.username}] LISTENING on ${ws.freq}Hz`);

      broadcast({
        type: 'LISTEN',
        state: globalState,
        clientId: ws.clientId,
        username: ws.username,
        element: ws.element,
        frequency: ws.freq,
        band: ws.band
      });

      broadcastClientsUpdate();
      return;
    }

    if (msg.type === 'STOP') {
      ws.listening = globalState.listening = false;
      console.log(`[WS] [${ws.username}] STOPPED listening`);

      broadcast({
        type: 'STOP',
        state: globalState,
        clientId: ws.clientId,
        username: ws.username
      });

      broadcastClientsUpdate();
      return;
    }

    // ---------------------------------------------------------------------
    // MEND & FILLÁMEND LOCATED
    // ---------------------------------------------------------------------
    if (msg.type === 'MEND' || msg.type === 'FILLÁMEND_LOCATED') {
      msg.username = ws.username;
      msg.element = ws.element;
      console.log(`[WS] Event ${msg.type} from [${ws.username}]`);
      broadcast(msg);
      return;
    }

    // ---------------------------------------------------------------------
    // LOG / OBSERVATION PERSISTENCE
    // ---------------------------------------------------------------------
    if (msg.type === 'LOG' || msg.type === 'FILLÁMEND_LOG') {
      const observationText = String(msg.observation || msg.text || '').trim();
      const element = msg.element || ws.element || globalState.element;
      const freq = Number(msg.freq ?? msg.frequency ?? ws.freq ?? globalState.freq);
      const band = Number(msg.band ?? ws.band ?? globalState.band);
      const username = msg.username || ws.username || generateUsername(element);

      const entry = {
        id: msg.id || `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        username: username,
        element: element,
        freq: freq,
        band: band,
        observation: observationText,
        transmission: msg.transmission || 'TRANSMISSION STABILIZED',
        bearing: msg.bearing ?? 0,
        heading: msg.heading ?? 0,
        voiceFrequency: msg.voiceFrequency ?? freq,
        status: 'MENDED',
        timestamp: msg.timestamp || new Date().toISOString(),
        epoch: msg.epoch || `EPOCH 04.${Math.floor(10 + Math.random() * 80)}`,
        audioRecording: msg.audioRecording || null
      };

      saveLog(entry);

      // Broadcast with username prominently attached
      broadcast({
        type: 'FILLÁMEND_LOG',
        ...entry
      });

      // Optional Gemma AI response simulation
      setTimeout(() => {
        const responses = [
          `[Gemma Bridge]: Resonant signature confirmed at ${freq}Hz (${element}). Signal coherence established.`,
          `[Gemma Bridge]: Observation logged by ${username}. Cymatic nodal lines recorded into permanent strata.`,
          `[Gemma Bridge]: Signal stabilized. Material residue aligns with historical DACian hydrophone traces.`
        ];
        const gemmaText = responses[Math.floor(Math.random() * responses.length)];
        broadcast({
          type: 'GEMMA_RESPONSE',
          text: gemmaText
        });
      }, 700);

      return;
    }

    // ---------------------------------------------------------------------
    // LIVE AUDIO RECORDING STREAM / CHUNK
    // ---------------------------------------------------------------------
    if (msg.type === 'AUDIO_FEED_CHUNK') {
      broadcast({
        type: 'AUDIO_FEED_CHUNK',
        username: ws.username,
        element: ws.element,
        data: msg.data
      });
      return;
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Disconnected: ${ws.clientId} [${ws.username}]`);
    broadcastClientsUpdate();
  });

  ws.on('error', err => {
    console.error(`[WS] Error on ${ws.clientId}:`, err.message);
  });
});

// -------------------------------------------------------------------------
// SERVER LAUNCH
// -------------------------------------------------------------------------
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================================');
  console.log('   READER DAC-04 SIMULATION SERVER IS ACTIVE');
  console.log('========================================================');
  console.log(`Laptop Field Receiver:   http://localhost:${PORT}/laptop/`);
  console.log(`Handheld Phone Reader:   http://localhost:${PORT}/phone/`);
  console.log(`Archival Fillámend Logs: http://localhost:${PORT}/archive/`);
  console.log(`Repair / Mend Interface: http://localhost:${PORT}/repair/`);
  console.log(`WebSocket Endpoint:      ws://localhost:${PORT}/ws`);
  console.log(`Database Location:       ${DB_FILE}`);
  console.log('========================================================\n');
});
