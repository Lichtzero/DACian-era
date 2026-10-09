/**
 * =========================================================================
 * FIELD RECEIVER — CLIENT APPLICATION & TELEMETRY HUB
 * =========================================================================
 * Renders responsive element-dependent cymatic physics (Water & Sand),
 * manages multi-reader client screens, logs encounters with username brackets,
 * powers the navigable frequency map, and calculates researcher progression.
 */

// UI Selectors
const connection = document.querySelector('#connection');
const fieldTitle = document.querySelector('#fieldTitle');
const listeningStateBadge = document.querySelector('#listening-state-badge');
const instruction = document.querySelector('#instruction');
const sceneText = document.querySelector('#sceneText');
const freqEl = document.querySelector('#freq');
const bandEl = document.querySelector('#band');
const readerEl = document.querySelector('#reader');
const profileName = document.querySelector('#profile-name');
const profileElement = document.querySelector('#profile-element');
const gemma = document.querySelector('#gemma');
const optionHelp = document.querySelector('#optionHelp');
const optionText = document.querySelector('#optionText');
const connectedReadersContainer = document.querySelector('#connected-readers-container');
const connectedCountBadge = document.querySelector('#connected-count-badge');
const observationsFeed = document.querySelector('#observations-feed');
const logCountBadge = document.querySelector('#log-count-badge');
const cymaticModeOverlay = document.querySelector('#cymatic-mode-overlay');

// Canvases
const canvas = document.querySelector('#cymatic');
const ctx = canvas.getContext('2d');
const mapCanvas = document.querySelector('#frequency-map-canvas');
const mapCtx = mapCanvas.getContext('2d');
const mapTooltip = document.querySelector('#map-tooltip');

// Audio Rack Controls
const rackPreamp = document.querySelector('#rack-preamp');
const rackPreampVal = document.querySelector('#rack-preamp-val');
const rackChladni = document.querySelector('#rack-chladni');
const rackChladniVal = document.querySelector('#rack-chladni-val');
const rackDamp = document.querySelector('#rack-damp');
const rackDampVal = document.querySelector('#rack-damp-val');
const rackNotchBtn = document.querySelector('#rack-notch-btn');

// Gamification Selectors
const rankTitle = document.querySelector('#rank-title');
const xpVal = document.querySelector('#xp-val');
const xpProgressFill = document.querySelector('#xp-progress-fill');
const nextRankUnlock = document.querySelector('#next-rank-unlock');
const equipPreamp = document.querySelector('#equip-preamp');
const equipChladni = document.querySelector('#equip-chladni');
const equipFull = document.querySelector('#equip-full');

// Global Receiver State
let S = {
  element: 'WATER',
  freq: 440,
  band: 120,
  listening: false,
  observation: '',
  encounter: 1,
  voiceFrequency: 440,
  preampGain: 6,
  chladniMult: 1.0,
  siltDamp: 40,
  notchActive: false
};

let connectedClients = [];
let historicalLogs = [];
let currentXp = 0;
let phase = 0;
let ws = null;
let reconnectTimer = null;

// Thematic Texts
const SCENARIOS = {
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
    scene: 'Wind has exposed part of an old structure. Fine quartz grains shift over dormant nodes that should not be there.'
  }
};

// -------------------------------------------------------------------------
// RESPONSIVE CANVASES
// -------------------------------------------------------------------------
function resizeCanvases() {
  const dpr = window.devicePixelRatio || 1;

  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }

  if (mapCanvas) {
    const mapRect = mapCanvas.getBoundingClientRect();
    mapCanvas.width = mapRect.width * dpr;
    mapCanvas.height = mapRect.height * dpr;
    drawFrequencyMap();
  }
}

window.addEventListener('resize', resizeCanvases);

// -------------------------------------------------------------------------
// GAMIFICATION PROGRESSION SYSTEM
// -------------------------------------------------------------------------
function updateProgression(totalLogsCount) {
  const count = typeof totalLogsCount === 'number' ? totalLogsCount : historicalLogs.length;
  currentXp = count * 50;

  if (xpVal) xpVal.textContent = currentXp;

  if (count < 2) {
    rankTitle.textContent = 'RANK I: NOVICE PROBE';
    nextRankUnlock.textContent = `NEXT UNLOCK: SUB-SURFACE CARTOGRAPHER (${2 - count} MORE LOGS)`;
    xpProgressFill.style.width = `${Math.min(100, (count / 2) * 50)}%`;
  } else if (count < 4) {
    rankTitle.textContent = 'RANK II: SUB-SURFACE CARTOGRAPHER';
    nextRankUnlock.textContent = `NEXT UNLOCK: DACIAN ACOUSTIC RESTORER (${4 - count} MORE LOGS)`;
    xpProgressFill.style.width = `${50 + ((count - 2) / 2) * 25}%`;
    equipPreamp.classList.add('active');
    equipPreamp.textContent = 'ACOUSTIC PREAMP [UNLOCKED]';
  } else if (count < 7) {
    rankTitle.textContent = 'RANK III: DACIAN ACOUSTIC RESTORER';
    nextRankUnlock.textContent = `NEXT UNLOCK: MASTER ARCHIVIST (${7 - count} MORE LOGS)`;
    xpProgressFill.style.width = `${75 + ((count - 4) / 3) * 25}%`;
    equipChladni.classList.add('active');
    equipChladni.textContent = 'CHLADNI AMPLIFIER [UNLOCKED]';
  } else {
    rankTitle.textContent = 'RANK IV: MASTER ARCHIVIST';
    nextRankUnlock.textContent = 'ALL HARMONIC MODULES & FREQUENCIES UNLOCKED';
    xpProgressFill.style.width = '100%';
    equipFull.classList.add('active');
    equipFull.textContent = '1200 HZ FULL SPECTRUM [UNLOCKED]';
  }
}

// -------------------------------------------------------------------------
// MULTI-USER CONNECTED READERS UI
// -------------------------------------------------------------------------
function renderConnectedReaders() {
  if (!connectedReadersContainer) return;

  const phoneReaders = connectedClients.filter(c => c.role === 'reader' || c.role === 'phone');

  if (connectedCountBadge) {
    connectedCountBadge.textContent = `${phoneReaders.length} ACTIVE`;
  }

  if (phoneReaders.length === 0) {
    connectedReadersContainer.innerHTML = `
      <div class="no-readers-notice">
        No handheld Readers linked. Scan QR on phone or open <code>/phone/</code> to link.
      </div>
    `;
    return;
  }

  connectedReadersContainer.innerHTML = phoneReaders
    .map(r => `
      <div class="reader-tile ${r.element.toLowerCase()}">
        <div class="reader-tile-info">
          <div class="reader-tile-name">
            [${r.username}]
            <span class="reader-element-tag">${r.element}</span>
          </div>
          <div class="reader-tile-meta">
            FREQ: ${r.freq} HZ | BAND: ${r.band} HZ
          </div>
        </div>
        <div class="reader-tile-status">
          ${r.listening ? '<span class="pulse-listening-dot"></span> LISTENING' : '<span style="color: #6a7c6c;">STANDBY</span>'}
        </div>
      </div>
    `)
    .join('');
}

// -------------------------------------------------------------------------
// OBSERVATIONS FEED (WITH USERNAME IN BRACKETS)
// -------------------------------------------------------------------------
function addObservationToFeed(log, prepend = true) {
  if (!observationsFeed) return;

  const username = log.username || 'Observer';
  const element = (log.element || S.element).toUpperCase();
  const freq = log.freq || log.frequency || S.freq;
  const band = log.band || S.band;
  const observation = log.observation || log.text || 'Observation logged.';
  const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'RECENT';

  const card = document.createElement('div');
  card.className = 'obs-card';
  card.innerHTML = `
    <div class="obs-card-header">
      <span class="obs-header-brackets ${element.toLowerCase()}">
        [${username}] [${freq} HZ / ${band} BAND / ${element}]
      </span>
      <span>${time}</span>
    </div>
    <div class="obs-card-text">“${observation}”</div>
    ${log.audioRecording ? '<div class="obs-audio-pill">▶ PLAY ACOUSTIC RECORDING</div>' : ''}
  `;

  if (log.audioRecording) {
    const pill = card.querySelector('.obs-audio-pill');
    pill.addEventListener('click', () => {
      try {
        const audio = new Audio(log.audioRecording);
        audio.play();
      } catch (e) {
        console.warn('Could not play audio memo', e);
      }
    });
  }

  if (prepend && observationsFeed.firstChild) {
    observationsFeed.insertBefore(card, observationsFeed.firstChild);
  } else {
    observationsFeed.appendChild(card);
  }

  if (logCountBadge) {
    logCountBadge.textContent = `${historicalLogs.length} SAVED`;
  }
}

// -------------------------------------------------------------------------
// INTERACTIVE FREQUENCY MAP (SPECTRAL ATLAS)
// -------------------------------------------------------------------------
function drawFrequencyMap() {
  if (!mapCanvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = mapCanvas.width;
  const h = mapCanvas.height;

  mapCtx.fillStyle = '#080b09';
  mapCtx.fillRect(0, 0, w, h);

  // Draw grid rules
  mapCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  mapCtx.lineWidth = 1 * dpr;

  // Horizontal frequency grid lines (every 200 Hz from 80 to 1200)
  for (let f = 100; f <= 1200; f += 100) {
    const x = ((f - 80) / (1200 - 80)) * w;
    mapCtx.beginPath();
    mapCtx.moveTo(x, 0);
    mapCtx.lineTo(x, h - 20 * dpr);
    mapCtx.stroke();

    // Frequency label
    mapCtx.fillStyle = '#445546';
    mapCtx.font = `${8 * dpr}px monospace`;
    mapCtx.fillText(`${f}Hz`, x - 12 * dpr, h - 6 * dpr);
  }

  // Vertical depth grid lines
  for (let b = 100; b <= 500; b += 100) {
    const y = (1 - (b - 20) / (500 - 20)) * (h - 25 * dpr);
    mapCtx.beginPath();
    mapCtx.moveTo(0, y);
    mapCtx.lineTo(w, y);
    mapCtx.stroke();
  }

  // Plot historical logs as glowing nodes
  historicalLogs.forEach((log) => {
    const f = log.freq || log.frequency || 440;
    const b = log.band || 120;
    const isSand = log.element === 'SAND';

    const x = ((f - 80) / (1200 - 80)) * w;
    const y = (1 - (b - 20) / (500 - 20)) * (h - 25 * dpr);

    // Glow circle
    mapCtx.beginPath();
    mapCtx.fillStyle = isSand ? 'rgba(227, 198, 134, 0.25)' : 'rgba(134, 227, 206, 0.25)';
    mapCtx.arc(x, y, 9 * dpr, 0, Math.PI * 2);
    mapCtx.fill();

    // Core point
    mapCtx.beginPath();
    mapCtx.fillStyle = isSand ? '#e3c686' : '#86e3ce';
    mapCtx.arc(x, y, 4 * dpr, 0, Math.PI * 2);
    mapCtx.fill();
  });

  // Plot current tuned frequency line (RED indicator)
  const currentX = ((S.freq - 80) / (1200 - 80)) * w;
  mapCtx.strokeStyle = '#ff5555';
  mapCtx.lineWidth = 1.5 * dpr;
  mapCtx.beginPath();
  mapCtx.moveTo(currentX, 0);
  mapCtx.lineTo(currentX, h - 20 * dpr);
  mapCtx.stroke();

  // Current tuned indicator dot
  const currentY = (1 - (S.band - 20) / (500 - 20)) * (h - 25 * dpr);
  mapCtx.beginPath();
  mapCtx.fillStyle = '#ff5555';
  mapCtx.arc(currentX, currentY, 5 * dpr, 0, Math.PI * 2);
  mapCtx.fill();
}

// Frequency map mouse interaction & tooltip
if (mapCanvas) {
  mapCanvas.addEventListener('mousemove', (e) => {
    const rect = mapCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const w = rect.width;
    const h = rect.height;

    // Check hit on any plotted log
    let hoveredLog = null;
    historicalLogs.forEach((log) => {
      const f = log.freq || log.frequency || 440;
      const b = log.band || 120;
      const x = ((f - 80) / (1200 - 80)) * w;
      const y = (1 - (b - 20) / (500 - 20)) * (h - 20);

      const dist = Math.hypot(mx - x, my - y);
      if (dist < 12) hoveredLog = log;
    });

    if (hoveredLog && mapTooltip) {
      mapTooltip.style.display = 'block';
      mapTooltip.style.left = `${mx + 10}px`;
      mapTooltip.style.top = `${my - 30}px`;
      mapTooltip.innerHTML = `
        <strong>[${hoveredLog.username || 'Observer'}]</strong><br>
        ${hoveredLog.freq}Hz / ${hoveredLog.element}<br>
        <span style="color:#a7d59b;">“${(hoveredLog.observation || '').slice(0, 50)}...”</span>
      `;
    } else if (mapTooltip) {
      mapTooltip.style.display = 'none';
    }
  });

  mapCanvas.addEventListener('mouseleave', () => {
    if (mapTooltip) mapTooltip.style.display = 'none';
  });

  // Click map to re-tune frequency
  mapCanvas.addEventListener('click', (e) => {
    const rect = mapCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const newFreq = Math.round(80 + (mx / rect.width) * (1200 - 80));
    const newBand = Math.round(20 + (1 - my / (rect.height - 20)) * (500 - 20));

    S.freq = Math.max(80, Math.min(1200, newFreq));
    S.band = Math.max(20, Math.min(500, newBand));

    if (freqEl) freqEl.textContent = S.freq;
    if (bandEl) bandEl.textContent = S.band;

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'CONTROL',
        frequency: S.freq,
        band: S.band
      }));
    }

    drawFrequencyMap();
  });
}

// -------------------------------------------------------------------------
// HARDWARE AUDIO MODIFIER RACK LISTENERS
// -------------------------------------------------------------------------
if (rackPreamp) {
  rackPreamp.addEventListener('input', (e) => {
    S.preampGain = Number(e.target.value);
    if (rackPreampVal) rackPreampVal.textContent = `+${S.preampGain} dB`;
  });
}

if (rackChladni) {
  rackChladni.addEventListener('input', (e) => {
    S.chladniMult = Number(e.target.value);
    if (rackChladniVal) rackChladniVal.textContent = `${S.chladniMult.toFixed(1)}x`;
  });
}

if (rackDamp) {
  rackDamp.addEventListener('input', (e) => {
    S.siltDamp = Number(e.target.value);
    if (rackDampVal) rackDampVal.textContent = `${S.siltDamp}%`;
  });
}

if (rackNotchBtn) {
  rackNotchBtn.addEventListener('click', () => {
    S.notchActive = !S.notchActive;
    rackNotchBtn.textContent = `NOTCH: ${S.notchActive ? 'ENGAGED' : 'OFF'}`;
    rackNotchBtn.classList.toggle('active', S.notchActive);
  });
}

// -------------------------------------------------------------------------
// WEBSOCKET RELAY CONNECTION
// -------------------------------------------------------------------------
function connect() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws`;

  console.log('[RECEIVER] Connecting to:', wsUrl);

  try {
    ws = new WebSocket(wsUrl);
  } catch (err) {
    console.error('[RECEIVER] WebSocket setup error:', err);
    scheduleReconnect();
    return;
  }

  ws.addEventListener('open', () => {
    console.log('[RECEIVER] WebSocket connected');
    if (connection) {
      connection.textContent = 'LINKED';
      connection.classList.add('linked');
    }

    ws.send(JSON.stringify({
      type: 'HELLO',
      role: 'laptop',
      element: S.element
    }));
  });

  ws.addEventListener('close', () => {
    console.log('[RECEIVER] WebSocket disconnected');
    if (connection) {
      connection.textContent = 'STANDBY';
      connection.classList.remove('linked');
    }
    scheduleReconnect();
  });

  ws.addEventListener('error', err => {
    console.error('[RECEIVER] WebSocket error:', err);
  });

  ws.addEventListener('message', ev => {
    let m;
    try {
      m = JSON.parse(ev.data);
    } catch (e) {
      return;
    }

    // STATE UPDATE
    if (m.type === 'STATE') {
      if (m.element && m.element !== S.element) {
        S.element = m.element;
        if (profileElement) profileElement.textContent = S.element;
        if (fieldTitle) fieldTitle.textContent = SCENARIOS[S.element]?.title || `FIELD / ${S.element}`;
        if (instruction) instruction.textContent = SCENARIOS[S.element]?.instruction || 'FOLLOW';
        if (sceneText) sceneText.textContent = SCENARIOS[S.element]?.scene || '';
      }

      if (m.frequency !== undefined) S.freq = Number(m.frequency);
      if (m.band !== undefined) S.band = Number(m.band);
      if (m.listening !== undefined) S.listening = Boolean(m.listening);
      if (m.running !== undefined) S.listening = Boolean(m.running);
      if (m.username && profileName) profileName.textContent = m.username;

      updateTelemetryUI();
      drawFrequencyMap();
    }

    // LISTEN & STOP
    if (m.type === 'LISTEN') {
      S.listening = true;
      if (m.frequency !== undefined) S.freq = Number(m.frequency);
      if (m.band !== undefined) S.band = Number(m.band);
      updateTelemetryUI();
    }

    if (m.type === 'STOP') {
      S.listening = false;
      updateTelemetryUI();
    }

    // CLIENTS LIST UPDATE
    if (m.type === 'CLIENTS_UPDATE') {
      connectedClients = m.clients || [];
      renderConnectedReaders();
    }

    // HISTORICAL LOGS RECEPTION
    if (m.type === 'HISTORY_LOGS') {
      historicalLogs = m.logs || [];
      if (observationsFeed) observationsFeed.innerHTML = '';
      historicalLogs.forEach(l => addObservationToFeed(l, false));
      updateProgression(historicalLogs.length);
      drawFrequencyMap();
    }

    // NEW LOG OBSERVATION
    if (m.type === 'FILLÁMEND_LOG' || m.type === 'LOG') {
      historicalLogs.unshift(m);
      addObservationToFeed(m, true);
      updateProgression(historicalLogs.length);
      drawFrequencyMap();
    }

    // GEMMA RESPONSE
    if (m.type === 'GEMMA_RESPONSE') {
      if (gemma) gemma.textContent = m.text || '';
    }
  });
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 2000);
}

function updateTelemetryUI() {
  if (freqEl) freqEl.textContent = S.freq;
  if (bandEl) bandEl.textContent = S.band;

  if (listeningStateBadge) {
    if (S.listening) {
      listeningStateBadge.textContent = 'LISTENING';
      listeningStateBadge.className = 'state-pill state-listening';
    } else {
      listeningStateBadge.textContent = 'IDLE';
      listeningStateBadge.className = 'state-pill state-idle';
    }
  }

  if (cymaticModeOverlay) {
    if (S.element === 'WATER') {
      cymaticModeOverlay.textContent = S.listening
        ? `AQUEOUS HARMONICS // ${S.freq} HZ ACTIVE RESONANCE`
        : `WATER STANDBY // CALM TIDES (${S.freq} HZ)`;
    } else {
      cymaticModeOverlay.textContent = S.listening
        ? `CHLADNI NODAL FIGURES // ${S.freq} HZ SAND DISPERSION`
        : `SAND STANDBY // DORMANT QUARTZ (${S.freq} HZ)`;
    }
  }
}

// -------------------------------------------------------------------------
// OPTION KEY CONTEXT OVERRIDE
// -------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.key === 'Alt' || e.key === 'Option') {
    if (optionHelp && optionText) {
      optionText.textContent = SCENARIOS[S.element]?.explanation || '';
      optionHelp.style.display = 'block';
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'Alt' || e.key === 'Option') {
    if (optionHelp) optionHelp.style.display = 'none';
  }
});

// -------------------------------------------------------------------------
// RESPONSIVE CYMATIC FIELD RENDERING LOOP
// (RESPONSIVE TO ELEMENT & LISTENING STATE)
// -------------------------------------------------------------------------
function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width;
  const h = canvas.height;

  if (w === 0 || h === 0) {
    requestAnimationFrame(draw);
    return;
  }

  const cx = w / 2;
  const cy = h / 2;

  // Background fade clear
  ctx.fillStyle = S.element === 'WATER' ? '#080d0a' : '#0d0a07';
  ctx.fillRect(0, 0, w, h);

  const f = Number(S.freq) || 440;
  const b = Number(S.band) || 120;
  const isListening = S.listening;
  const isSand = S.element === 'SAND';

  // Speed and dynamic multipliers
  const speed = isListening ? 0.05 : 0.015;
  phase += speed;

  const ampMultiplier = isListening ? 1.4 * S.chladniMult : 0.45;

  // -----------------------------------------------------------------------
  // ELEMENT = WATER (CONCENTRIC STANDING WAVES & FLUID VORTICES)
  // -----------------------------------------------------------------------
  if (!isSand) {
    const particleCount = isListening ? 240 : 120;

    // Outer fluid particles
    for (let i = 0; i < particleCount; i++) {
      const a = (i / particleCount) * Math.PI * 2;
      const wave = Math.sin(a * 5 + phase * 1.5) * (b * 0.22 * ampMultiplier);
      const r = (40 * dpr) + (i * 1.8 * dpr) + wave;

      const x = cx + Math.cos(a + phase * 0.2) * (r + wave * 0.5);
      const y = cy + Math.sin(a + phase * 0.2) * (r * 0.6 + wave * 0.3);

      const alpha = isListening ? (0.2 + 0.5 * (i / particleCount)) : 0.15;
      ctx.fillStyle = `rgba(134, 227, 206, ${alpha})`;
      ctx.fillRect(x, y, 2.5 * dpr, 2.5 * dpr);
    }

    // Concentric acoustic pressure rings
    const ringCount = isListening ? 10 : 5;
    for (let k = 0; k < ringCount; k++) {
      ctx.beginPath();
      const ringBaseRadius = (50 + k * 28) * dpr;

      for (let i = 0; i <= 180; i++) {
        const a = (i / 180) * Math.PI * 2;
        const nodalWobble = Math.sin(a * 4 + phase * (1 + k * 0.04)) * (b * 0.14 * ampMultiplier);
        const rr = ringBaseRadius + nodalWobble;

        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * (rr * 0.65);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const ringAlpha = isListening ? 0.35 : 0.1;
      ctx.strokeStyle = `rgba(134, 227, 206, ${ringAlpha})`;
      ctx.lineWidth = (k === 3 ? 2 : 1) * dpr;
      ctx.stroke();
    }
  }

  // -----------------------------------------------------------------------
  // ELEMENT = SAND (CHLADNI NODAL FIGURES & GRANULAR PARTICLES)
  // -----------------------------------------------------------------------
  else {
    const grainCount = isListening ? 360 : 160;

    // Chladni plate formula: m and n modal integers based on frequency
    const m = Math.max(2, Math.floor(f / 160));
    const n = Math.max(2, Math.floor(b / 80));

    for (let i = 0; i < grainCount; i++) {
      const a = (i / grainCount) * Math.PI * 2;
      const rad = ((i % 12) * 22 + 30) * dpr;

      // Nodal function: cos(n*x)*cos(m*y) - cos(m*x)*cos(n*y)
      const chladni = Math.cos(n * a) * Math.cos(m * a) * (ampMultiplier * 20 * dpr);
      const jitter = isListening ? (Math.random() - 0.5) * 4 * dpr : 0;

      const r = rad + chladni + jitter;
      const x = cx + Math.cos(a + phase * 0.1) * r;
      const y = cy + Math.sin(a + phase * 0.1) * (r * 0.7);

      const alpha = isListening ? (0.35 + 0.45 * Math.sin(a * m)) : 0.18;
      ctx.fillStyle = `rgba(227, 198, 134, ${Math.max(0.1, alpha)})`;
      ctx.fillRect(x, y, (isListening ? 2.5 : 2) * dpr, (isListening ? 2.5 : 2) * dpr);
    }

    // Geometric Chladni nodal curves
    const curveRings = isListening ? 8 : 4;
    for (let k = 0; k < curveRings; k++) {
      ctx.beginPath();
      const baseR = (45 + k * 32) * dpr;

      for (let i = 0; i <= 180; i++) {
        const a = (i / 180) * Math.PI * 2;
        const modal = Math.cos(a * m + phase * 0.5) * Math.sin(a * n) * (25 * dpr * ampMultiplier);
        const rr = baseR + modal;

        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * (rr * 0.7);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = isListening ? 'rgba(227, 198, 134, 0.4)' : 'rgba(227, 198, 134, 0.12)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
    }
  }

  requestAnimationFrame(draw);
}

// -------------------------------------------------------------------------
// INITIALIZATION
// -------------------------------------------------------------------------
resizeCanvases();
connect();
requestAnimationFrame(draw);

// Fetch initial database records
fetch('/api/logs')
  .then(r => r.json())
  .then(logs => {
    historicalLogs = logs || [];
    if (observationsFeed) observationsFeed.innerHTML = '';
    historicalLogs.forEach(l => addObservationToFeed(l, false));
    updateProgression(historicalLogs.length);
    drawFrequencyMap();
  })
  .catch(e => console.warn('Could not fetch initial logs:', e));