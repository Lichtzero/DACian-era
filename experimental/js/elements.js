/**
 * =========================================================================
 * EXPERIMENTAL READER — ELEMENTS ENGINE (WATER VS SAND)
 * =========================================================================
 * Renders distinct visual and behavioural representations of WATER and SAND.
 * In this experimental paradigm, an element is a voluntary stance of
 * attention and practice—never an automated sound classifier.
 */

window.DAC_ELEMENTS = (function () {
  let activeElement = 'WATER'; // Default initial choice

  // Simulation particle state for SAND
  let sandParticles = [];
  const NUM_GRAINS = 120;

  // Ripple state for WATER
  let waterRipples = [];
  let waterPhase = 0;

  function initSimulations(canvas) {
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    // Initialize sand grains
    sandParticles = [];
    for (let i = 0; i < NUM_GRAINS; i++) {
      sandParticles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: Math.random() * 0.5 + 0.2, // Drift downward like falling silt/sand
        strataY: Math.floor(Math.random() * 5) * (h / 5),
        alpha: Math.random() * 0.6 + 0.3
      });
    }

    // Initialize water ripples
    waterRipples = [
      { radius: 10, maxRadius: 160, speed: 1.2, x: w * 0.5, y: h * 0.5 },
      { radius: 60, maxRadius: 200, speed: 0.9, x: w * 0.45, y: h * 0.52 },
      { radius: 110, maxRadius: 240, speed: 0.7, x: w * 0.55, y: h * 0.48 }
    ];
  }

  /**
   * Render Canvas Frame based on Chosen Element and Live Telemetry
   */
  function renderElementCanvas(ctx, width, height, telemetry) {
    if (!ctx) return;

    if (activeElement === 'WATER') {
      renderWaterBehavior(ctx, width, height, telemetry);
    } else {
      renderSandBehavior(ctx, width, height, telemetry);
    }
  }

  /**
   * WATER VISUAL BEHAVIOR:
   * Continuous sinusoidal interference waves, fluid ripples, hydrophone low-pass nodes
   */
  function renderWaterBehavior(ctx, width, height, telemetry) {
    waterPhase += 0.035;
    const rms = telemetry ? telemetry.rms : 0.05;
    const timeData = telemetry ? telemetry.timeData : null;

    // Deep water clearing fill
    ctx.fillStyle = 'rgba(6, 12, 14, 0.28)';
    ctx.fillRect(0, 0, width, height);

    const centerY = height / 2;

    // 1. Draw Expanding Resonance Ripples
    ctx.lineWidth = 1.2;
    for (const rip of waterRipples) {
      rip.radius += rip.speed + rms * 3;
      if (rip.radius > rip.maxRadius) {
        rip.radius = 5;
      }
      const alpha = Math.max(0, 1 - rip.radius / rip.maxRadius) * 0.45;
      ctx.strokeStyle = `rgba(78, 205, 196, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.radius * 1.4, rip.radius * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Draw Continuous Flowing Wave Interference Layers
    const waveCount = 3;
    for (let w = 0; w < waveCount; w++) {
      ctx.beginPath();
      const waveAlpha = 0.35 + (w * 0.25);
      ctx.strokeStyle = `rgba(78, 205, 196, ${waveAlpha})`;
      ctx.lineWidth = 1.5;

      for (let x = 0; x < width; x += 3) {
        const normX = x / width;
        const timeFactor = timeData ? (timeData[Math.floor(normX * 128)] - 128) / 128 : 0;
        const waveY =
          centerY +
          Math.sin(normX * (6 + w * 2) + waterPhase + w) * (20 + rms * 50) +
          Math.sin(normX * 14 - waterPhase * 0.8) * 8 +
          timeFactor * 30;

        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
  }

  /**
   * SAND VISUAL BEHAVIOR:
   * Granular particle drift, friction shear, horizontal geological strata
   */
  function renderSandBehavior(ctx, width, height, telemetry) {
    const rms = telemetry ? telemetry.rms : 0.05;

    // Granular obsidian clearing fill
    ctx.fillStyle = 'rgba(12, 10, 8, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Stratified Contour Lines (Geological Layers)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(212, 163, 115, 0.15)';
    const strataLines = 5;
    for (let s = 1; s <= strataLines; s++) {
      const yBase = (height / (strataLines + 1)) * s;
      ctx.beginPath();
      for (let x = 0; x < width; x += 6) {
        const jitter = (Math.sin(x * 0.05 + s) + Math.cos(x * 0.02)) * 4;
        const y = yBase + jitter;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 2. Animate and Render Granular Sand Particles
    for (const p of sandParticles) {
      // Movement with acoustic excitation jitter
      p.x += p.speedX + (Math.random() - 0.5) * (rms * 15);
      p.y += p.speedY + (Math.random() - 0.5) * (rms * 10);

      // Wrap boundaries
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y > height) {
        p.y = 0;
        p.x = Math.random() * width;
      }

      ctx.fillStyle = `rgba(212, 163, 115, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + (rms * 2), 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw Particulate Friction Waveform (Fractured Line)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(235, 195, 145, 0.85)';
    ctx.lineWidth = 1.5;
    const centerY = height / 2;
    for (let x = 0; x < width; x += 4) {
      const normX = x / width;
      const grainJitter = (Math.random() - 0.5) * (12 + rms * 60);
      const y = centerY + Math.sin(normX * 12) * 12 + grainJitter;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  /**
   * Set Chosen Element
   */
  function setElement(elementName) {
    activeElement = elementName === 'SAND' ? 'SAND' : 'WATER';
    return activeElement;
  }

  /**
   * Get Qualitative Observation Prompt
   */
  function getObservationPrompt() {
    if (activeElement === 'WATER') {
      return 'What currents, acoustic echoes, or fluid transitions are moving through this place?';
    } else {
      return 'What friction, lingering residue, or structural remnants remain in this ground?';
    }
  }

  return {
    initSimulations,
    renderElementCanvas,
    setElement,
    getElement: () => activeElement,
    getObservationPrompt
  };
})();
