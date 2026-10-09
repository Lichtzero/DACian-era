/**
 * =========================================================================
 * SIGNAL CANVAS — ANALOGUE OSCILLOSCOPE & CYMATIC WAVEFORM TRACER
 * =========================================================================
 * Renders a subtle, non-intrusive analogue signal trace on HTML5 canvas.
 * Simulates carrier wave modulation, water/sand granular friction,
 * and frequency resonance sweeps.
 */

(function () {
  const canvas = document.querySelector('#hero-oscilloscope');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const freqSlider = document.querySelector('#freq-tuner-input');
  const freqDisplay = document.querySelector('#freq-val-display');
  const stateDisplay = document.querySelector('#signal-state-display');

  let width = (canvas.width = canvas.offsetWidth);
  let height = (canvas.height = canvas.offsetHeight);

  const DEFAULT_FREQ = 240; 
  const WATER_FREQ = 440; 
  const SAND_FREQ = 820; 
  // Both start at 240 so the page loads directly at 240 Hz let currentFreq = DEFAULT_FREQ; let targetFreq = DEFAULT_FREQ;

  let currentFreq = DEFAULT_FREQ;
  let targetFreq = DEFAULT_FREQ;
  let phase = 0;
  let animId = null;
  let isVisible = true;

  // --------------------------------------------------------- 
  // INITIAL UI STATE 
  // ---------------------------------------------------------

  if (freqSlider) { freqSlider.value = DEFAULT_FREQ; 
  } 
  if (freqDisplay) { freqDisplay.textContent = DEFAULT_FREQ + ' HZ';
  } 
  if (stateDisplay) { stateDisplay.textContent = 'SEARCHING SPECTRUM...'; 
   stateDisplay.style.color = 'var(--accent-cyan)'; 
  }

  // Resize listener
  window.addEventListener('resize', () => {
    if (!canvas) return;
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  });

  // Frequency slider listener
  if (freqSlider) {
    freqSlider.addEventListener('input', (e) => {
      targetFreq = parseFloat(e.target.value);
      if (freqDisplay) {
        freqDisplay.textContent = Math.round(targetFreq) + ' HZ';
      }
      if (stateDisplay) {
        if (Math.abs(targetFreq - WATER_FREQ) < 15) {
          stateDisplay.textContent = 'RESONANCE LOCKED [WATER]';
          stateDisplay.style.color = 'rgb(0, 255, 195)';
        } else if (Math.abs(targetFreq - SAND_FREQ) < 15) {
          stateDisplay.textContent = 'RESONANCE LOCKED [SAND]';
          stateDisplay.style.color = '#e3c686';
        } else {
          stateDisplay.textContent = 'SEARCHING SPECTRUM...';
          stateDisplay.style.color = 'var(--accent-cyan)';
        }
      }
    });
  }

  // Draw loop
  function draw() {
    if (!isVisible) {
      animId = requestAnimationFrame(draw);
      return;
    }

    // Smooth frequency interpolation
    currentFreq += (targetFreq - currentFreq) * 0.1;
    phase += 0.04;

    // Slight fade clear for phosphorus persistence effect
    ctx.fillStyle = 'rgba(15, 14, 13, 0.28)';
    ctx.fillRect(0, 0, width, height);

    const centerY = height / 2;

    // Draw secondary harmonic (subtle ghost trace)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(110, 56, 40, 0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 2) {
      const normX = x / width;
      const k1 = currentFreq * 0.015;
      const y = centerY + Math.sin(normX * k1 + phase * 0.7) * 25 * Math.sin(normX * Math.PI);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

   // Draw primary signal trace

ctx.beginPath();

const isLockedw = Math.abs(currentFreq - WATER_FREQ) < 15;
const isLockeds = Math.abs(currentFreq - SAND_FREQ) < 15;

if (isLockedw) {
  // WATER
  ctx.strokeStyle = 'rgb(115, 248, 217)';
  ctx.lineWidth = 2;

} else if (isLockeds) {
  // SAND
  ctx.strokeStyle = 'rgb(255, 228, 147)';
  ctx.lineWidth = 2;

} else {
  // DEFAULT / SEARCHING — 240 Hz
  ctx.strokeStyle = '#ffff';
  ctx.lineWidth = 1.5;
}

    for (let x = 0; x < width; x += 1.5) {
      const normX = x / width;
      const kPrimary = currentFreq * 0.02;
      const kEnvelope = Math.sin(normX * Math.PI); // Pinches at edges

      // Primary sine carrier + micro-texture
      let wave = Math.sin(normX * kPrimary + phase);
      // Subtle buried modulation
      wave += Math.sin(normX * kPrimary * 2.1 + phase * 1.3) * 0.28;
      // Granular jitter
      const noise = (Math.random() - 0.5) * 2;

      const y = centerY + (wave * 38 + noise) * kEnvelope;

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw horizontal zero line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    animId = requestAnimationFrame(draw);
  }

  // Optimize when offscreen
  const observer = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0].isIntersecting;
    },
    { threshold: 0.05 }
  );
  observer.observe(canvas);

  draw();
})();
