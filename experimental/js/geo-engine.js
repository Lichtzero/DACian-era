/**
 * =========================================================================
 * EXPERIMENTAL READER — GEOGRAPHIC ENGINE & PROXIMITY SENSING
 * =========================================================================
 * Handles foreground geolocation, privacy coordinate formatting,
 * proximity-based filament encounters (Haversine metric), and
 * contextual element suggestions in Indian urban/ecological geography.
 */

window.DAC_GEO = (function () {
  // Default regional reference: Pune / Maharashtra (Mula-Mutha river basin)
  const DEFAULT_REGION = {
    lat: 18.5204,
    lng: 73.8567,
    name: 'Pune // Mula-Mutha Basin',
    zoneType: 'alluvial_basin'
  };

  let currentLocation = null;
  let isGeoPermitted = false;
  let isWatching = false;
  let watchId = null;
  let onProximityCallback = null;

  /**
   * Request Foreground Location
   */
  function requestLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('[GeoEngine] Geolocation API not supported');
        currentLocation = { ...DEFAULT_REGION, isSimulated: true };
        resolve({ success: false, location: currentLocation, reason: 'unsupported' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          isGeoPermitted = true;
          currentLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            timestamp: pos.timestamp,
            isSimulated: false
          };
          startWatch();
          resolve({ success: true, location: currentLocation });
        },
        (err) => {
          console.warn('[GeoEngine] Geolocation denied or timeout:', err.message);
          isGeoPermitted = false;
          currentLocation = { ...DEFAULT_REGION, isSimulated: true };
          resolve({ success: false, location: currentLocation, reason: err.message });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  }

  function startWatch() {
    if (isWatching || !navigator.geolocation) return;
    isWatching = true;
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        currentLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: pos.timestamp,
          isSimulated: false
        };
        checkProximity();
      },
      (err) => {
        console.warn('[GeoEngine] Watch warning:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000
      }
    );
  }

  function stopWatch() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      isWatching = false;
    }
  }

  /**
   * Great-circle Haversine Distance (in meters)
   */
  function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Proximity Checker against stored filaments
   */
  function checkProximity() {
    if (!currentLocation || !window.DAC_STORE) return;
    const filaments = window.DAC_STORE.getFilaments();
    const thresholdMeters = 250; // 250m encounter bubble

    for (const f of filaments) {
      if (f.lat && f.lng) {
        const dist = calculateDistanceMeters(currentLocation.lat, currentLocation.lng, f.lat, f.lng);
        if (dist <= thresholdMeters) {
          if (onProximityCallback) {
            onProximityCallback(f, dist);
          }
          break; // Trigger closest filament
        }
      }
    }
  }

  function setProximityHandler(fn) {
    onProximityCallback = fn;
  }

  /**
   * Contextual Element Suggestion
   * Gently hints whether terrain might evoke WATER or SAND, but never forces it.
   */
  function getContextualElementSuggestion(lat, lng) {
    const targetLat = lat || (currentLocation ? currentLocation.lat : DEFAULT_REGION.lat);
    const targetLng = lng || (currentLocation ? currentLocation.lng : DEFAULT_REGION.lng);

    // Approximate known hydrological vectors in Western India context:
    // (Rivers, estuaries, lakes, dams, wetlands)
    const isNearWaterbody = (targetLat > 18.50 && targetLat < 18.55 && targetLng > 73.83 && targetLng < 73.89);

    if (isNearWaterbody) {
      return {
        suggested: 'WATER',
        reason: 'Nearby riverine corridor / alluvial sediment detected. Terrain may invite focus on acoustic flow and fluid resonance.'
      };
    } else {
      return {
        suggested: 'SAND',
        reason: 'Built mineral structures and dry soil strata detected. Terrain may invite focus on granular friction and historical residue.'
      };
    }
  }

  /**
   * Format coordinates for display with privacy rounding
   */
  function formatCoordinate(coord, precision = 4) {
    if (coord === undefined || coord === null) return '0.0000';
    return Number(coord).toFixed(precision);
  }

  return {
    requestLocation,
    stopWatch,
    getLocation: () => currentLocation || DEFAULT_REGION,
    isPermitted: () => isGeoPermitted,
    calculateDistanceMeters,
    setProximityHandler,
    checkProximity,
    getContextualElementSuggestion,
    formatCoordinate,
    DEFAULT_REGION
  };
})();
