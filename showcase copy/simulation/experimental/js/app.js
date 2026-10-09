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
  const filterModeSelect = document.getElementById('filter-mode-select');
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
  const gpsCoordDisplay = document.getElementById('log-gps-display');
  const contextHint = document.getElementById('element-context-hint');

  const statusMicChip = document.getElementById('status-chip-mic');
  const statusGpsChip = document.getElementById('status-chip-gps');

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
  const cassettePlayer = document.getElementById('cassette-player');
  const cassetteSpeed = document.getElementById('cassette-speed-input');
  const cassetteSpeedLabel = document.getElementById('cassette-speed-label');

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
      const isListening = window.DAC_AUDIO?.getState().isListening;
      window.DAC_ELEMENTS.renderElementCanvas(ctx, canvas.width, canvas.height, telemetry, isListening);
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
        if (window.DAC_AUDIO.getState().isRecordingAudio) {
          const result = await window.DAC_AUDIO.stopRecordingAudio();
          recordBtn.classList.remove('recording');
          recordBtn.innerHTML = '<span>◉</span> RECORD CLIP';
          if (result) {
            recordedAudioPayload = result;
            if (recordStatus) recordStatus.textContent = `ATTACHED (${result.durationSec}s)`;
          }
        }
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

  if (filterModeSelect) filterModeSelect.addEventListener('change', (e) => window.DAC_AUDIO.setFilterType(e.target.value));

  // Explicit Audio Recording
  if (recordBtn) {
    recordBtn.addEventListener('click', async () => {
      const state = window.DAC_AUDIO.getState();

      if (!state.isRecordingAudio) {
        const started = window.DAC_AUDIO.startRecordingAudio((sec) => {
          if (recordStatus) recordStatus.textContent = `REC: ${sec}s`;
          if (sec >= 20 && window.DAC_AUDIO.getState().isRecordingAudio) recordBtn.click();
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

  window.addEventListener('reader:location-updated', (event) => {
    const loc = event.detail;
    if (loc && window.DAC_MAP) window.DAC_MAP.centerOn(loc.lat, loc.lng);
  });

  // -------------------------------------------------------------------------
  // 5. INTERACTIVE MAP & BOTTOM SHEET
  // -------------------------------------------------------------------------
  function openFilamentDetail(f) {
    if (!drawer) return;
    if (activeAudioPlayer) {
      activeAudioPlayer.pause();
      activeAudioPlayer = null;
    }
    if (cassetteSpeed) cassetteSpeed.value = '1';
    if (cassetteSpeedLabel) cassetteSpeedLabel.textContent = '1.0×';

    drawerElementBadge.textContent = f.element;
    drawerElementBadge.className = `status-chip ${f.element === 'WATER' ? 'active-mic' : 'active-gps'}`;
    drawerRegion.textContent = f.regionName || 'Situated Field Coordinates';
    drawerTimestamp.textContent = new Date(f.timestamp).toLocaleString();
    drawerObservation.textContent = `“${f.observation}”`;
    drawerSettings.textContent = `TUNING RECORD: ${f.freq} Hz (Band: ${f.band} Hz) // ${f.isSeed ? 'Historical Archival Seed' : 'Anonymous Field Trace'}`;

    if (f.hasAudio && f.audioDataUrl) {
      drawerPlayerBox.style.display = 'flex';
      drawerPlayBtn.onclick = () => playTraceAudio(f);
    } else {
      drawerPlayerBox.style.display = 'none';
    }

    drawer.classList.add('open');
    if (drawerPlayBtn) drawerPlayBtn.textContent = '▶ PLAY';
    if (cassettePlayer) cassettePlayer.classList.remove('playing');
    // Highlight selected filament cluster in particle map
    if (window.DAC_PARTICLE_MAP) window.DAC_PARTICLE_MAP.selectFilament(f.id);
  }

  function playTraceAudio(f) {
    if (activeAudioPlayer) {
      activeAudioPlayer.pause();
      activeAudioPlayer = null;
      drawerPlayBtn.textContent = '▶ PLAY';
      cassettePlayer?.classList.remove('playing');
      return;
    }

    if (f.audioDataUrl) {
      activeAudioPlayer = new Audio(f.audioDataUrl);
      activeAudioPlayer.playbackRate = Number(cassetteSpeed?.value || 1);
      activeAudioPlayer.play().catch(() => {
        drawerPlayBtn.textContent = 'PLAY UNAVAILABLE';
      });
      drawerPlayBtn.textContent = 'Ⅱ PAUSE';
      cassettePlayer?.classList.add('playing');
      activeAudioPlayer.onended = () => {
        drawerPlayBtn.textContent = '▶ PLAY';
        cassettePlayer?.classList.remove('playing');
        activeAudioPlayer = null;
      };
    }
  }

  cassetteSpeed?.addEventListener('input', () => {
    const speed = Number(cassetteSpeed.value);
    if (activeAudioPlayer) activeAudioPlayer.playbackRate = speed;
    if (cassetteSpeedLabel) cassetteSpeedLabel.textContent = `${speed.toFixed(1)}×`;
  });

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', () => {
      drawer.classList.remove('open');
      if (activeAudioPlayer) {
        activeAudioPlayer.pause();
        activeAudioPlayer = null;
      }
      if (drawerPlayBtn) drawerPlayBtn.textContent = '▶ PLAY';
      if (cassettePlayer) cassettePlayer.classList.remove('playing');
      // Deselect filament highlight
      if (window.DAC_PARTICLE_MAP) window.DAC_PARTICLE_MAP.selectFilament(null);
    });
  }

  // Initialize Map
  if (window.DAC_MAP) {
    window.DAC_MAP.initMap('field-particle-map', openFilamentDetail);
  }
  window.addEventListener('filaments:updated', () => {
    if (window.DAC_MAP) window.DAC_MAP.renderFilamentsOnMap();
  });

  // Radius slider (phone sensing radius for particle map)
  const radiusSlider  = document.getElementById('radius-slider');
  const radiusDisplay = document.getElementById('radius-display');
  if (radiusSlider) {
    radiusSlider.addEventListener('input', (e) => {
      const r = Number(e.target.value);
      if (radiusDisplay) radiusDisplay.textContent = `${(r * 111320 / 9000 / 1000).toFixed(1)} km`;
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
          errEl.textContent = 'Add a short note before saving this pin.';
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
      depositBtn.textContent = 'SAVING PIN...';

      const loc = window.DAC_GEO ? window.DAC_GEO.getLocation() : { lat: 18.5204, lng: 73.8567 };
      const element = window.DAC_ELEMENTS ? window.DAC_ELEMENTS.getElement() : 'WATER';
      const freq = freqSlider ? Number(freqSlider.value) : 440;
      const band = bandSlider ? Number(bandSlider.value) : 120;

      await window.DAC_STORE.createFilament({
        observation: text,
        element: element,
        lat: loc.lat,
        lng: loc.lng,
        regionName: loc.name || `Field Sector [${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}]`,
        freq: freq,
        band: band,
        audioDataUrl: recordedAudioPayload ? recordedAudioPayload.dataUrl : null,
        audioDurationSec: recordedAudioPayload ? recordedAudioPayload.durationSec : 0,
        shareToNetwork: true
      });

      // Reset form
      if (obsInput) obsInput.value = '';
      recordedAudioPayload = null;
      if (recordStatus) recordStatus.textContent = 'NONE';

      // Update Map
      if (window.DAC_MAP) {
        window.DAC_MAP.renderFilamentsOnMap();
      }

      depositBtn.disabled = false;
      depositBtn.textContent = 'PIN SAVED';
      setTimeout(() => {
        depositBtn.textContent = 'Save pin';
      }, 2500);

      // The pin appears on the radar; open it only when selected there.
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
