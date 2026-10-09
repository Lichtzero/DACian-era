/**
 * =========================================================================
 * EXPERIMENTAL READER — APPLICATION CONTROLLER
 * =========================================================================
 * Coordinates the phone-first field practice:
 * 1. Independent audio & geolocation permissions
 * 2. Voluntary WATER vs SAND practice selection
 * 3. Live spectrum & cymatic canvas rendering loop
 * 4. Interactive map exploration and sparse area invitations
 * 5. Anonymous logging and filament deposition
 * 6. Bottom-sheet filament detail inspection with audio playback
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const listenBtn = document.getElementById('listen-toggle-btn');
  const recordBtn = document.getElementById('record-audio-btn');
  const recordStatus = document.getElementById('record-status-display');
  const freqSlider = document.getElementById('freq-slider-input');
  const bandSlider = document.getElementById('band-slider-input');
  const freqDisplay = document.getElementById('freq-display-val');
  const bandDisplay = document.getElementById('band-display-val');
  const filterToggleBtn = document.getElementById('filter-mode-toggle');
  const monitorSlider = document.getElementById('monitor-slider-input');
  const monitorDisplay = document.getElementById('monitor-display-val');

  const canvas = document.getElementById('field-sensor-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  const waterSelectBtn = document.getElementById('select-water-btn');
  const sandSelectBtn = document.getElementById('select-sand-btn');
  const elementCard = document.getElementById('element-card');
  const obsPrompt = document.getElementById('observation-prompt');
  const obsInput = document.getElementById('observation-text-input');
  const depositBtn = document.getElementById('deposit-filament-btn');
  const shareInput = document.getElementById('share-filament-input');
  const gpsCoordDisplay = document.getElementById('log-gps-display');
  const contextHint = document.getElementById('element-context-hint');

  const statusMicChip = document.getElementById('status-chip-mic');
  const statusGpsChip = document.getElementById('status-chip-gps');
  const proximityBanner = document.getElementById('proximity-alert-banner');
  const proximityText = document.getElementById('proximity-banner-text');

  // Bottom Sheet Drawer Elements
  const drawer = document.getElementById('filament-drawer');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerElementBadge = document.getElementById('drawer-element-badge');
  const drawerRegion = document.getElementById('drawer-region');
  const drawerTimestamp = document.getElementById('drawer-timestamp');
  const drawerObservation = document.getElementById('drawer-observation');
  const drawerSettings = document.getElementById('drawer-settings');
  const drawerPlayerBox = document.getElementById('drawer-player-box');
  const drawerPlayBtn = document.getElementById('drawer-play-audio-btn');

  let recordedAudioPayload = null;
  let activeAudioPlayer = null;

  // -------------------------------------------------------------------------
  // 1. CANVAS SETUP & ANIMATION LOOP
  // -------------------------------------------------------------------------
  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight || 220;
    if (window.DAC_ELEMENTS) {
      window.DAC_ELEMENTS.initSimulations(canvas);
    }
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function animLoop() {
    if (ctx && canvas && window.DAC_ELEMENTS) {
      const telemetry = window.DAC_AUDIO ? window.DAC_AUDIO.getAcousticTelemetry() : null;
      window.DAC_ELEMENTS.renderElementCanvas(ctx, canvas.width, canvas.height, telemetry);
      document.body.style.setProperty('--sound-energy', String(Math.min(1, telemetry ? telemetry.rms * 5 : 0)));
    }
    requestAnimationFrame(animLoop);
  }
  requestAnimationFrame(animLoop);

  // -------------------------------------------------------------------------
  // 2. ELEMENT SELECTION (VOLUNTARY PRACTICE)
  // -------------------------------------------------------------------------
  function updateElementUI(elem) {
    window.DAC_ELEMENTS.setElement(elem);

    if (elem === 'WATER') {
      waterSelectBtn.classList.add('active');
      sandSelectBtn.classList.remove('active');
      elementCard.className = 'element-toggle-card mode-water';
      document.body.classList.remove('mode-sand');
      document.body.classList.add('mode-water');
    } else {
      sandSelectBtn.classList.add('active');
      waterSelectBtn.classList.remove('active');
      elementCard.className = 'element-toggle-card mode-sand';
      document.body.classList.remove('mode-water');
      document.body.classList.add('mode-sand');
    }

    if (obsPrompt) {
      obsPrompt.textContent = window.DAC_ELEMENTS.getObservationPrompt();
    }
  }

  if (waterSelectBtn) {
    waterSelectBtn.addEventListener('click', () => updateElementUI('WATER'));
  }
  if (sandSelectBtn) {
    sandSelectBtn.addEventListener('click', () => updateElementUI('SAND'));
  }

  // -------------------------------------------------------------------------
  // 3. AUDIO LISTENING CONTROLS
  // -------------------------------------------------------------------------
  if (listenBtn) {
    listenBtn.addEventListener('click', async () => {
      const state = window.DAC_AUDIO.getState();

      if (!state.isListening) {
        listenBtn.textContent = 'CONNECTING SENSOR...';
        const res = await window.DAC_AUDIO.startListening();

        if (res.listening) {
          listenBtn.innerHTML = '<span>■</span> STOP LISTENING';
          listenBtn.classList.add('listening');

          if (statusMicChip) {
            statusMicChip.classList.add('active-mic');
            statusMicChip.textContent = res.mode === 'live_environmental' ? 'MIC: LIVE AMBIENT' : 'MIC: SYNTH FALLBACK';
          }
        }
      } else {
        window.DAC_AUDIO.stopListening();
        listenBtn.innerHTML = '<span>▶</span> BEGIN LISTENING';
        listenBtn.classList.remove('listening');

        if (statusMicChip) {
          statusMicChip.classList.remove('active-mic');
          statusMicChip.textContent = 'MIC: STANDBY';
        }
      }
    });
  }

  if (freqSlider) {
    freqSlider.addEventListener('input', (e) => {
      const freq = Number(e.target.value);
      if (freqDisplay) freqDisplay.textContent = `${freq} HZ`;
      window.DAC_AUDIO.setTuning(freq, bandSlider ? bandSlider.value : 120);
    });
  }

  if (bandSlider) {
    bandSlider.addEventListener('input', (e) => {
      const band = Number(e.target.value);
      if (bandDisplay) bandDisplay.textContent = `${band} HZ`;
      window.DAC_AUDIO.setTuning(freqSlider ? freqSlider.value : 440, band);
    });
  }

  if (monitorSlider) {
    monitorSlider.addEventListener('input', (e) => {
      const level = Number(e.target.value);
      window.DAC_AUDIO.setMonitorVolume(level);
      if (monitorDisplay) monitorDisplay.textContent = `${Math.round(level * 100)}%`;
    });
  }

  if (filterToggleBtn) {
    filterToggleBtn.addEventListener('click', () => {
      const isFiltered = window.DAC_AUDIO.toggleFilterMode(!window.DAC_AUDIO.getState().isFilteredMode);
      filterToggleBtn.textContent = isFiltered ? 'FILTERED' : 'RAW SOUND';
      filterToggleBtn.style.color = isFiltered ? 'var(--accent-water)' : 'var(--text-secondary)';
    });
  }

  // Explicit Audio Recording
  if (recordBtn) {
    recordBtn.addEventListener('click', async () => {
      const state = window.DAC_AUDIO.getState();

      if (!state.isRecordingAudio) {
        const started = window.DAC_AUDIO.startRecordingAudio((sec) => {
          if (recordStatus) recordStatus.textContent = `REC: ${sec}s`;
        });
        if (started) {
          recordBtn.classList.add('recording');
          recordBtn.innerHTML = '<span>■</span> STOP REC';
        }
      } else {
        const result = await window.DAC_AUDIO.stopRecordingAudio();
        recordBtn.classList.remove('recording');
        recordBtn.innerHTML = '<span>◉</span> RECORD CLIP';
        if (result) {
          recordedAudioPayload = result;
          if (recordStatus) recordStatus.textContent = `ATTACHED (${result.durationSec}s)`;
        } else {
          if (recordStatus) recordStatus.textContent = 'NONE';
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // 4. GEOLOCATION & PROXIMITY INITIALIZATION
  // -------------------------------------------------------------------------
  async function initGeolocation() {
    if (!window.DAC_GEO) return;
    const res = await window.DAC_GEO.requestLocation();
    const loc = res.location;

    if (statusGpsChip) {
      if (res.success) {
        statusGpsChip.classList.add('active-gps');
        statusGpsChip.textContent = `GPS: ±${loc.accuracy}M`;
      } else {
        statusGpsChip.textContent = 'GPS: REGIONAL BASE';
      }
    }

    if (gpsCoordDisplay) {
      gpsCoordDisplay.textContent = `${window.DAC_GEO.formatCoordinate(loc.lat)}, ${window.DAC_GEO.formatCoordinate(loc.lng)}`;
    }

    // Contextual element hint
    const hint = window.DAC_GEO.getContextualElementSuggestion(loc.lat, loc.lng);
    if (contextHint && hint) {
      contextHint.textContent = `Contextual Signal: ${hint.reason}`;
    }

    if (window.DAC_MAP) {
      window.DAC_MAP.centerOn(loc.lat, loc.lng);
      window.DAC_MAP.updateUserPositionMarker();
      window.DAC_MAP.recenterOnUser();
    }
  }

  // Proximity callback
  if (window.DAC_GEO) {
    window.DAC_GEO.setProximityHandler((filament, distMeters) => {
      if (proximityBanner && proximityText) {
        proximityBanner.style.display = 'flex';
        proximityText.innerHTML = '<span>✦</span> A SOUND TRACE IS CLOSE BY';
        proximityBanner.onclick = () => openFilamentDetail(filament);
      }
    });
  }
  window.addEventListener('reader:location-updated', (event) => {
    const loc = event.detail;
    if (loc && window.DAC_MAP) window.DAC_MAP.centerOn(loc.lat, loc.lng);
  });

  // -------------------------------------------------------------------------
  // 5. INTERACTIVE MAP & BOTTOM SHEET
  // -------------------------------------------------------------------------
  function openFilamentDetail(f) {
    if (!drawer) return;

    drawerElementBadge.textContent = f.element;
    drawerElementBadge.className = `status-chip ${f.element === 'WATER' ? 'active-mic' : 'active-gps'}`;
    drawerRegion.textContent = f.regionName || 'Situated Field Coordinates';
    drawerTimestamp.textContent = new Date(f.timestamp).toLocaleString();
    drawerObservation.textContent = `“${f.observation}”`;
    drawerSettings.textContent = `TUNING RECORD: ${f.freq} Hz (Band: ${f.band} Hz) // ${f.isSeed ? 'Historical Archival Seed' : 'Anonymous Field Trace'}`;

    if (f.hasAudio && (f.audioDataUrl || f.isSeed)) {
      drawerPlayerBox.style.display = 'flex';
      drawerPlayBtn.onclick = () => playTraceAudio(f);
    } else {
      drawerPlayerBox.style.display = 'none';
    }

    drawer.classList.add('open');
    // Highlight selected filament cluster in particle map
    if (window.DAC_PARTICLE_MAP) window.DAC_PARTICLE_MAP.selectFilament(f.id);
  }

  function playTraceAudio(f) {
    if (activeAudioPlayer) {
      activeAudioPlayer.pause();
      activeAudioPlayer = null;
      drawerPlayBtn.textContent = 'PLAY RECORDED SOUND';
      return;
    }

    if (f.audioDataUrl) {
      activeAudioPlayer = new Audio(f.audioDataUrl);
      activeAudioPlayer.play();
      drawerPlayBtn.textContent = 'PAUSE SOUND';
      activeAudioPlayer.onended = () => {
        drawerPlayBtn.textContent = 'PLAY RECORDED SOUND';
        activeAudioPlayer = null;
      };
    } else {
      // Synthetic acoustic resonance representation of the trace
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(f.freq, ctx.currentTime);
      osc.type = f.element === 'WATER' ? 'sine' : 'sawtooth';
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 3);
      drawerPlayBtn.textContent = 'RESONATING...';
      setTimeout(() => {
        drawerPlayBtn.textContent = 'PLAY TRACE RESONANCE';
      }, 3000);
    }
  }

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', () => {
      drawer.classList.remove('open');
      if (activeAudioPlayer) {
        activeAudioPlayer.pause();
        activeAudioPlayer = null;
      }
      // Deselect filament highlight
      if (window.DAC_PARTICLE_MAP) window.DAC_PARTICLE_MAP.selectFilament(null);
    });
  }

  // Initialize Map
  if (window.DAC_MAP) {
    window.DAC_MAP.initMap('field-particle-map', openFilamentDetail);
  }

  // Radius slider (phone sensing radius for particle map)
  const radiusSlider  = document.getElementById('radius-slider');
  const radiusDisplay = document.getElementById('radius-display');
  if (radiusSlider) {
    radiusSlider.addEventListener('input', (e) => {
      const r = Number(e.target.value);
      if (radiusDisplay) radiusDisplay.textContent = r;
      if (window.DAC_PARTICLE_MAP) window.DAC_PARTICLE_MAP.setRadius(r);
    });
  }

  // -------------------------------------------------------------------------
  // 6. ANONYMOUS FILAMENT DEPOSIT
  // -------------------------------------------------------------------------
  if (depositBtn) {
    depositBtn.addEventListener('click', async () => {
      const text = obsInput ? obsInput.value.trim() : '';

      // Show or hide inline validation error
      const existingErr = document.getElementById('deposit-inline-error');
      if (!text) {
        if (!existingErr) {
          const errEl = document.createElement('div');
          errEl.id = 'deposit-inline-error';
          errEl.className = 'field-inline-error visible';
          errEl.textContent = 'OBSERVATION REQUIRED — write what you hear before depositing a filament.';
          obsInput.parentElement.insertBefore(errEl, obsInput.nextSibling);
        } else {
          existingErr.classList.add('visible');
        }
        obsInput.focus();
        return;
      } else if (existingErr) {
        existingErr.classList.remove('visible');
      }

      depositBtn.disabled = true;
      depositBtn.textContent = 'DEPOSITING TRACE...';

      const loc = window.DAC_GEO ? window.DAC_GEO.getLocation() : { lat: 18.5204, lng: 73.8567 };
      const element = window.DAC_ELEMENTS ? window.DAC_ELEMENTS.getElement() : 'WATER';
      const freq = freqSlider ? Number(freqSlider.value) : 440;
      const band = bandSlider ? Number(bandSlider.value) : 120;

      const newFilament = await window.DAC_STORE.createFilament({
        observation: text,
        element: element,
        lat: loc.lat,
        lng: loc.lng,
        regionName: loc.name || `Field Sector [${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}]`,
        freq: freq,
        band: band,
        audioDataUrl: recordedAudioPayload ? recordedAudioPayload.dataUrl : null,
        audioDurationSec: recordedAudioPayload ? recordedAudioPayload.durationSec : 0,
        shareToNetwork: Boolean(shareInput && shareInput.checked)
      });

      // Reset form
      if (obsInput) obsInput.value = '';
      recordedAudioPayload = null;
      if (recordStatus) recordStatus.textContent = 'NONE';
      if (shareInput) shareInput.checked = false;

      // Update Map
      if (window.DAC_MAP) {
        window.DAC_MAP.renderFilamentsOnMap();
      }

      depositBtn.disabled = false;
      depositBtn.textContent = 'TRACE DEPOSITED ✓';
      setTimeout(() => {
        depositBtn.textContent = 'DEPOSIT FILAMENT INTO STRATA';
      }, 2500);

      // Open new filament
      openFilamentDetail(newFilament);
    });
  }

  // -------------------------------------------------------------------------
  // 7. VIEW TABS (SENSOR vs MAP)
  // -------------------------------------------------------------------------
  const tabSensor = document.getElementById('tab-sensor');
  const tabMap = document.getElementById('tab-map');
  const sectionSensor = document.getElementById('section-sensor');
  const sectionMap = document.getElementById('section-map');

  if (tabSensor && tabMap) {
    tabSensor.addEventListener('click', () => {
      tabSensor.classList.add('active');
      tabMap.classList.remove('active');
      document.body.classList.remove('tab-map-active');
      // On desktop the grid handles layout; on mobile sensor is now shown
    });

    tabMap.addEventListener('click', () => {
      tabMap.classList.add('active');
      tabSensor.classList.remove('active');
      document.body.classList.add('tab-map-active');
      // Leaflet needs to know its container resized after display change
      setTimeout(() => {
        if (window.DAC_MAP) window.DAC_MAP.invalidateSize();
      }, 50);
    });
  }

  // Start Geolocation
  initGeolocation();
});
