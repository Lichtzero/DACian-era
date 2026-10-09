/**
 * =========================================================================
 * DACIAN ERA — HOLOGRAPHIC PARTICLE MAP ENGINE
 * =========================================================================
 * Renders a signal field, not a conventional geographic map.
 *
 * Philosophy:
 * - Black void. Fine luminous particles only where filaments/logs exist.
 * - Phone: limited sensing radius — everything beyond is unresolved black.
 *   The radius feels like the reach of a sensing instrument, not a GPS circle.
 * - Laptop: wider field, still shows disconnected clusters only.
 *   Unknown space between regions remains empty void.
 * - WATER and SAND have fundamentally different particle behaviours,
 *   not merely different accent colors.
 * - Filament selection brightens and stabilises its particle cluster.
 * - No terrain, roads, map tiles, or decorative geography.
 */

window.DAC_PARTICLE_MAP = (function () {

  // -------------------------------------------------------------------------
  // CONFIGURATION (tunable for prototype testing)
  // -------------------------------------------------------------------------
  const CONFIG = {
    // Phone sensing radius in canvas pixels (configurable via setRadius)
    PHONE_RADIUS: 260,

    // Fade band: outer fraction of radius transitions to black (0–1)
    FADE_FRACTION: 0.28,

    // Geographic projection scale: pixels per decimal degree
    // Higher = more zoomed in, clusters closer together
    GEO_SCALE: 9000,

    // Reference lat/lng (center of known archive; update if archive shifts)
    REF_LAT: 18.5204,
    REF_LNG: 73.8567,

    // Particles generated per filament
    BASE_PARTICLES: 55,
    SEED_BONUS: 25,      // seed filaments get more particles (richer history)

    // WATER particle behaviour
    WATER: {
      color: { r: 78,  g: 205, b: 196 },       // cyan
      spread: { rx: 52, ry: 32 },               // elliptical — wider than tall
      sizeRange: [0.5, 2.0],
      alphaRange: [0.12, 0.52],
      motionType: 'wave',                        // sinusoidal flowing drift
      speedRange: [0.4, 1.1],
      phaseSpread: Math.PI * 2,
    },

    // SAND particle behaviour
    SAND: {
      color: { r: 212, g: 163, b: 115 },        // warm silica amber
      spread: { rx: 36, ry: 36 },               // circular — granular
      sizeRange: [0.4, 1.4],
      alphaRange: [0.15, 0.55],
      motionType: 'drift',                       // slow settling, occasional jitter
      speedRange: [0.05, 0.22],
      phaseSpread: Math.PI * 2,
    },

    // Visual state when a filament is selected
    SELECTED_ALPHA_MULT: 2.8,
    SELECTED_SIZE_MULT: 2.0,
    SELECTED_GLOW_RADIUS: 10,

    // Background void
    BG: '#000000',
  };

  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------
  let canvas = null;
  let ctx = null;
  let particles = [];
  let filaments = [];
  let selectedId = null;
  let viewMode = 'phone';  // 'phone' | 'laptop'
  let onClickFilament = null;
  let animFrame = null;
  let tick = 0;
  let isRunning = false;

  // -------------------------------------------------------------------------
  // GEO → CANVAS PROJECTION
  // Simple equirectangular projection centered on reference position.
  // -------------------------------------------------------------------------
  function geoToCanvas(lat, lng) {
    if (!canvas) return { x: 0, y: 0 };
    const W = canvas.width;
    const H = canvas.height;
    const dx =  (lng - CONFIG.REF_LNG) * CONFIG.GEO_SCALE;
    const dy = -(lat - CONFIG.REF_LAT) * CONFIG.GEO_SCALE; // Y inverted (north up)
    return {
      x: W / 2 + dx,
      y: H / 2 + dy
    };
  }

  // -------------------------------------------------------------------------
  // PARTICLE GENERATION
  // Each filament spawns a cluster of particles at its projected canvas position.
  // -------------------------------------------------------------------------
  function spawnParticlesForFilament(f) {
    if (!canvas) return [];
    const pos = geoToCanvas(f.lat, f.lng);
    const def = f.element === 'SAND' ? CONFIG.SAND : CONFIG.WATER;
    const count = CONFIG.BASE_PARTICLES + (f.isSeed ? CONFIG.SEED_BONUS : 0);
    const result = [];

    for (let i = 0; i < count; i++) {
      // Scatter in element-specific ellipse
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random();
      // Non-uniform density: more particles near center (sqrt distribution)
      const sr = Math.sqrt(r);
      const bx = pos.x + Math.cos(angle) * sr * def.spread.rx;
      const by = pos.y + Math.sin(angle) * sr * def.spread.ry;

      const speed = def.speedRange[0] + Math.random() * (def.speedRange[1] - def.speedRange[0]);
      const size  = def.sizeRange[0]  + Math.random() * (def.sizeRange[1]  - def.sizeRange[0]);
      const alpha = def.alphaRange[0] + Math.random() * (def.alphaRange[1] - def.alphaRange[0]);
      const phase = Math.random() * def.phaseSpread;

      result.push({
        // Current position
        x: bx, y: by,
        // Origin (particles drift back to this)
        bx, by,
        size, alpha, speed, phase,
        motionType: def.motionType,
        color: def.color,
        filamentId: f.id,
        element: f.element,

        // SAND: slow directional drift vectors
        driftX: (Math.random() - 0.5) * 0.18,
        driftY: Math.random() * 0.10 + 0.02, // slight downward settling
      });
    }

    // Store canvas centre on the filament for click detection
    f._cx = pos.x;
    f._cy = pos.y;
    f._spreadR = Math.max(def.spread.rx, def.spread.ry);

    return result;
  }

  function rebuildAllParticles() {
    particles = [];
    for (const f of filaments) {
      particles.push(...spawnParticlesForFilament(f));
    }
  }

  // -------------------------------------------------------------------------
  // PARTICLE ANIMATION
  // -------------------------------------------------------------------------
  function animateParticle(p) {
    if (p.motionType === 'wave') {
      // WATER: sinusoidal interference — two layered waves
      const t = tick * 0.018;
      p.x = p.bx + Math.sin(t + p.phase)       * 4.5 * p.speed
                 + Math.cos(t * 0.7 + p.phase)  * 2.0 * p.speed;
      p.y = p.by + Math.cos(t * 0.9 + p.phase)  * 2.8 * p.speed
                 + Math.sin(t * 1.3 + p.phase)   * 1.2 * p.speed;
    } else {
      // SAND: slow granular drift with occasional settling reset
      p.x += p.driftX;
      p.y += p.driftY;

      // Boundary clamp: keep particle near its base position
      const maxDrift = 22;
      if (Math.abs(p.x - p.bx) > maxDrift) {
        p.x = p.bx + (Math.random() - 0.5) * 8;
        p.driftX *= -0.5;
      }
      if (p.y - p.by > maxDrift) {
        p.y = p.by - maxDrift * 0.8;
      }

      // Occasional micro-jitter (grain collision / wind)
      if (Math.random() < 0.003) {
        p.x += (Math.random() - 0.5) * 5;
        p.y += (Math.random() - 0.5) * 3;
      }
    }
  }

  // -------------------------------------------------------------------------
  // RENDER LOOP
  // -------------------------------------------------------------------------
  function render() {
    if (!ctx || !canvas) return;
    tick++;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const isPhone = viewMode === 'phone';
    const senseR = CONFIG.PHONE_RADIUS;
    const fadeStart = senseR * (1 - CONFIG.FADE_FRACTION);

    // Black void
    ctx.fillStyle = CONFIG.BG;
    ctx.fillRect(0, 0, W, H);

    // Disable shadow by default (enabled per-particle when glowing)
    ctx.shadowBlur = 0;

    for (const p of particles) {
      animateParticle(p);

      const isSelected = p.filamentId === selectedId;

      // --- Phone: radius gating ---
      if (isPhone) {
        const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
        if (dist > senseR) continue;

        let edgeFade = 1;
        if (dist > fadeStart) {
          edgeFade = 1 - (dist - fadeStart) / (senseR - fadeStart);
          edgeFade = Math.max(0, edgeFade);
        }

        const a = Math.min(1, (isSelected ? p.alpha * CONFIG.SELECTED_ALPHA_MULT : p.alpha) * edgeFade);
        const s = isSelected ? p.size * CONFIG.SELECTED_SIZE_MULT : p.size;
        drawDot(p.x, p.y, s, p.color, a, isSelected);
      } else {
        // --- Laptop: all particles within their cluster, no radius cut ---
        const a = Math.min(1, isSelected ? p.alpha * CONFIG.SELECTED_ALPHA_MULT : p.alpha);
        const s = isSelected ? p.size * CONFIG.SELECTED_SIZE_MULT : p.size;
        drawDot(p.x, p.y, s, p.color, a, isSelected);
      }
    }

    // Phone: soft radial vignette to black — natural fade, no visible ring
    if (isPhone) {
      const grad = ctx.createRadialGradient(cx, cy, senseR * 0.62, cx, cy, senseR * 1.15);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Laptop: corner vignettes to suggest bounded field, not a complete view
    if (!isPhone) {
      renderLaptopVignette(W, H);
    }

    animFrame = requestAnimationFrame(render);
  }

  function drawDot(x, y, size, col, alpha, glow) {
    if (glow) {
      ctx.shadowBlur  = CONFIG.SELECTED_GLOW_RADIUS;
      ctx.shadowColor = `rgba(${col.r},${col.g},${col.b},0.9)`;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.3, size), 0, Math.PI * 2);
    ctx.fill();
  }

  function renderLaptopVignette(W, H) {
    // Subtle edge darkening — reinforces that the field is incomplete
    const edgeSize = Math.min(W, H) * 0.22;
    const dirs = [
      { x0: 0, y0: 0,  x1: edgeSize, y1: 0 },
      { x0: W, y0: 0,  x1: W - edgeSize, y1: 0 },
    ];
    // Top / bottom fades
    [[0, 0, 0, edgeSize * 0.8], [0, H, 0, H - edgeSize * 0.8]].forEach(([x, y0, , y1]) => {
      const g = ctx.createLinearGradient(x, y0, x, y1);
      g.addColorStop(0, 'rgba(0,0,0,0.7)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, Math.min(y0, y1), W, edgeSize * 0.8);
    });
  }

  // -------------------------------------------------------------------------
  // CLICK / TAP DETECTION
  // -------------------------------------------------------------------------
  function handleCanvasClick(e) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Support both mouse and touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const mx = (clientX - rect.left) * (canvas.width  / rect.width);
    const my = (clientY - rect.top)  * (canvas.height / rect.height);

    let nearest = null;
    let nearestDist = Infinity;

    for (const f of filaments) {
      if (f._cx === undefined) continue;
      const d = Math.sqrt((f._cx - mx) ** 2 + (f._cy - my) ** 2);
      // Hit radius: filament spread + generous tap target
      const hitR = (f._spreadR || 40) + 20;
      if (d < hitR && d < nearestDist) {
        nearestDist = d;
        nearest = f;
      }
    }

    if (nearest) {
      selectedId = nearest.id;
      if (onClickFilament) onClickFilament(nearest);
    } else {
      selectedId = null;
    }
  }

  // -------------------------------------------------------------------------
  // PUBLIC API
  // -------------------------------------------------------------------------

  /**
   * Initialise the particle map.
   * @param {HTMLCanvasElement} canvasEl
   * @param {'phone'|'laptop'} mode
   * @param {Function} onFilamentClick  called with filament object on tap/click
   */
  function init(canvasEl, mode, onFilamentClick) {
    if (!canvasEl) return;
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    viewMode = mode || 'phone';
    onClickFilament = onFilamentClick;

    canvas.addEventListener('click',      handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasClick, { passive: true });

    resize();

    if (!isRunning) {
      isRunning = true;
      animFrame = requestAnimationFrame(render);
    }
  }

  /**
   * Replace the filament dataset and rebuild particles.
   * Call whenever new filaments are deposited or retrieved.
   */
  function updateFilaments(newFilaments) {
    filaments = Array.isArray(newFilaments) ? newFilaments : [];
    rebuildAllParticles();
  }

  /**
   * Highlight a specific filament by ID.
   * Pass null to deselect.
   */
  function selectFilament(id) {
    selectedId = id || null;
  }

  /**
   * Resize canvas to fill its parent.
   * Call on window resize and after CSS display changes.
   */
  function resize() {
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width  = parent ? parent.clientWidth  : 600;
    canvas.height = parent ? parent.clientHeight : 420;
    rebuildAllParticles();
  }

  /**
   * Change the phone sensing radius at runtime.
   * @param {number} px  radius in canvas pixels
   */
  function setRadius(px) {
    CONFIG.PHONE_RADIUS = Math.max(60, Number(px) || 260);
  }

  /**
   * Stop the render loop and release resources.
   */
  function destroy() {
    isRunning = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    if (canvas) {
      canvas.removeEventListener('click',      handleCanvasClick);
      canvas.removeEventListener('touchstart', handleCanvasClick);
    }
    canvas = null;
    ctx = null;
    particles = [];
  }

  /**
   * Invalidate size (compatibility shim for callers expecting Leaflet API).
   */
  function invalidateSize() {
    resize();
  }

  return {
    init,
    updateFilaments,
    selectFilament,
    setRadius,
    resize,
    invalidateSize,
    destroy,
    getConfig: () => CONFIG,
  };

})();
