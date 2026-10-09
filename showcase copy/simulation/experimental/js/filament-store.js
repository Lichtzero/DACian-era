/**
 * =========================================================================
 * EXPERIMENTAL READER — FILAMENT ARCHIVE STORE (PHASE 1 & PHASE 2)
 * =========================================================================
 * Manages local persistence (localStorage) and shared backend synchronization
 * of situated listening records (filaments).
 * Anonymous contribution by default; clear labelling of historical seeds.
 */

window.DAC_STORE = (function () {
  const STORAGE_KEY = 'DACIAN_EXPERIMENTAL_FILAMENTS_V1';

  // Authentic Seed Records situated in Western / Indian context
  const SEED_FILAMENTS = [
    {
      id: 'fil-seed-01',
      isSeed: true,
      element: 'WATER',
      observation: 'Submerged hydrophone resonance near the weir. The water rushes over exposed basalt boulders; beneath the white noise, a deep 420 Hz pulse lingers from an old irrigation sluice.',
      lat: 18.5312,
      lng: 73.8445,
      regionName: 'Pune // Sangam Weir Confluence',
      freq: 420,
      band: 110,
      timestamp: '2026-09-14T06:40:00.000Z',
      hasAudio: true,
      audioDurationSec: 12,
      densityState: 'Layered'
    },
    {
      id: 'fil-seed-02',
      isSeed: true,
      element: 'SAND',
      observation: 'Wind scouring dry silt off the foundation brickwork. Heavy truck rumble on the distant bypass shakes the fine quartz powder on the sill, creating brief friction chatter.',
      lat: 18.5158,
      lng: 73.8560,
      regionName: 'Pune // Shaniwar Wada Outer Perimeter',
      freq: 810,
      band: 140,
      timestamp: '2026-09-18T14:15:00.000Z',
      hasAudio: false,
      densityState: 'Traced'
    },
    {
      id: 'fil-seed-03',
      isSeed: true,
      element: 'WATER',
      observation: 'Estuary tidal change at dusk. Mangrove roots whistling in retreating tide. The acoustic reflections between the concrete bridge pilings create overlapping comb-filter echoes.',
      lat: 18.9812,
      lng: 72.8250,
      regionName: 'Mumbai // Mahim Creek Crossing',
      freq: 380,
      band: 90,
      timestamp: '2026-09-22T18:30:00.000Z',
      hasAudio: true,
      audioDurationSec: 18,
      densityState: 'Traced'
    },
    {
      id: 'fil-seed-04',
      isSeed: true,
      element: 'SAND',
      observation: 'High stone quarry ridge. Granite dust drifting into abandoned water pump shafts. No human speech within earshot, only metallic wind shears across transmission lines.',
      lat: 18.4720,
      lng: 73.8210,
      regionName: 'Pune // Katraj Ridge Escarpment',
      freq: 790,
      band: 160,
      timestamp: '2026-09-29T11:05:00.000Z',
      hasAudio: false,
      densityState: 'Layered'
    }
  ];

  let inMemoryFilaments = [];

  function initStore() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        inMemoryFilaments = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEED_FILAMENTS];
      } else {
        inMemoryFilaments = [...SEED_FILAMENTS];
        persistLocal();
      }
    } catch (e) {
      console.warn('[FilamentStore] Storage init warning, using memory:', e);
      inMemoryFilaments = [...SEED_FILAMENTS];
    }

    // Attempt Phase 2 shared backend sync in background
    syncWithBackend();
  }

  function persistLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryFilaments));
    } catch (e) {
      console.warn('[FilamentStore] Local save failed (storage full?):', e);
    }
  }

  /**
   * Save a newly recorded observation as a situated Filament
   */
  async function createFilament(entry) {
    const newFilament = {
      id: `fil-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isSeed: false,
      element: entry.element || 'WATER',
      observation: String(entry.observation || '').trim(),
      lat: Number(entry.lat) || 18.5204,
      lng: Number(entry.lng) || 73.8567,
      regionName: entry.regionName || 'Situated Field Coordinates',
      freq: Number(entry.freq) || 440,
      band: Number(entry.band) || 120,
      timestamp: new Date().toISOString(),
      audioDataUrl: entry.audioDataUrl || null,
      hasAudio: Boolean(entry.audioDataUrl),
      audioDurationSec: entry.audioDurationSec || 0,
      visibility: entry.shareToNetwork ? 'shared' : 'local',
      densityState: 'Traced'
    };

    inMemoryFilaments.unshift(newFilament);
    persistLocal();

    // Publish only after the contributor explicitly chooses to share.
    try {
      if (entry.shareToNetwork) {
        fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newFilament,
            text: newFilament.observation,
            source: 'experimental_reader'
          })
        }).catch(() => {});
      }
    } catch (e) {}

    return newFilament;
  }

  /**
   * Retrieve all filaments
   */
  function getFilaments(filterElement = 'ALL') {
    if (filterElement === 'ALL') {
      return [...inMemoryFilaments];
    }
    return inMemoryFilaments.filter((f) => f.element === filterElement);
  }

  /**
   * Delete a locally created filament (privacy removal)
   */
  function deleteFilament(id) {
    const idx = inMemoryFilaments.findIndex((f) => f.id === id);
    if (idx !== -1) {
      inMemoryFilaments.splice(idx, 1);
      persistLocal();
      return true;
    }
    return false;
  }

  /**
   * Phase 2 Shared Archive Sync
   */
  async function syncWithBackend() {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const logs = await res.json();
        if (Array.isArray(logs) && logs.length > 0) {
          // Merge any remote logs that are not already present
          const existingIds = new Set(inMemoryFilaments.map((f) => f.id));
          logs.forEach((log) => {
            if (log.id && !existingIds.has(log.id) && log.observation) {
              inMemoryFilaments.push({
                id: log.id,
                isSeed: false,
                element: log.element || 'WATER',
                observation: log.observation,
                lat: log.lat || 18.5204 + (Math.random() - 0.5) * 0.05,
                lng: log.lng || 73.8567 + (Math.random() - 0.5) * 0.05,
                regionName: 'Relayed Shared Trace',
                freq: log.freq || 440,
                band: log.band || 120,
                timestamp: log.timestamp || new Date().toISOString(),
                hasAudio: Boolean(log.audioRecording),
                audioDataUrl: log.audioRecording || null
              });
            }
          });
          persistLocal();
          window.dispatchEvent(new CustomEvent('filaments:updated'));
        }
      }
    } catch (err) {
      // Quiet fallback: local mode operational
    }
  }

  initStore();
  // Keep the phone and laptop views in step while they remain open.
  setInterval(syncWithBackend, 30000);

  return {
    getFilaments,
    createFilament,
    deleteFilament,
    syncWithBackend,
    getSeedFilaments: () => [...SEED_FILAMENTS]
  };
})();
