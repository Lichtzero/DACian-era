/**
 * =========================================================================
 * EXPERIMENTAL READER — MAP VIEW ADAPTER
 * =========================================================================
 * Thin adapter between app.js controller and the DAC_PARTICLE_MAP engine.
 * Preserves the public API shape (initMap, renderFilamentsOnMap,
 * updateUserPositionMarker, recenterOnUser, invalidateSize) so no changes
 * are needed in app.js.
 *
 * The underlying Leaflet dependency has been removed. The particle map is
 * rendered entirely on an HTML5 canvas inside the map frame.
 */

window.DAC_MAP = (function () {
  let canvasEl = null;
  let onSelectFilamentCallback = null;

  /**
   * Initialise the particle map inside the given container element.
   * @param {string} containerId  ID of the map container div
   * @param {Function} onSelectFilament  called when user taps a filament
   */
  function initMap(containerId, onSelectFilament) {
    onSelectFilamentCallback = onSelectFilament;

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('[MapView] Container not found:', containerId);
      return;
    }

    // Clear any previous content and inject canvas
    container.innerHTML = '';
    canvasEl = document.createElement('canvas');
    canvasEl.style.width  = '100%';
    canvasEl.style.height = '100%';
    canvasEl.style.display = 'block';
    canvasEl.style.cursor  = 'crosshair';
    container.appendChild(canvasEl);

    // Determine view mode from data attribute on container or fallback
    const mode = container.dataset.mapMode || 'phone';

    if (window.DAC_PARTICLE_MAP) {
      window.DAC_PARTICLE_MAP.init(canvasEl, mode, (filament) => {
        if (onSelectFilamentCallback) onSelectFilamentCallback(filament);
      });

      // Load initial filament dataset
      renderFilamentsOnMap();
    }
  }

  /**
   * Push current filament dataset into the particle engine.
   * Call after any deposit or store refresh.
   */
  function renderFilamentsOnMap() {
    if (!window.DAC_PARTICLE_MAP || !window.DAC_STORE) return;
    const filaments = window.DAC_STORE.getFilaments();
    window.DAC_PARTICLE_MAP.updateFilaments(filaments);
  }

  function centerOn(lat, lng) {
    if (window.DAC_PARTICLE_MAP) window.DAC_PARTICLE_MAP.setCenter(lat, lng);
  }

  /**
   * No-op on the particle map (user position is implicit — always canvas centre
   * on phone; no marker needed on laptop overview).
   * Kept for API compatibility with app.js.
   */
  function updateUserPositionMarker() {
    // Particle map: phone view is always centred; no explicit marker required.
  }

  /**
   * No-op on the particle map — there is no panning; the field of particles
   * already centres on the reference position.
   * Kept for API compatibility with app.js.
   */
  function recenterOnUser() {
    // No-op for particle map.
  }

  /**
   * Force canvas resize (called after tab switches or layout changes).
   */
  function invalidateSize() {
    if (window.DAC_PARTICLE_MAP) {
      window.DAC_PARTICLE_MAP.resize();
    }
  }

  return {
    initMap,
    renderFilamentsOnMap,
    centerOn,
    updateUserPositionMarker,
    recenterOnUser,
    invalidateSize,
  };
})();
