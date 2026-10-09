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

  function initSimulations() {}

  /**
   * Render Canvas Frame based on Chosen Element and Live Telemetry
   */
  function renderElementCanvas(ctx, width, height, telemetry, isListening = false) {
    if (!ctx) return;
    const color = activeElement === 'WATER' ? '#48e3dc' : '#e0b47b';
    const centerY = height / 2;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(2, 9, 13, 0.92)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = `${color}42`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    if (!isListening || !telemetry?.timeData?.length) return;
    const samples = telemetry.timeData;
    const amplitude = activeElement === 'WATER' ? 0.44 : 0.32;
    ctx.beginPath();
    ctx.lineWidth = activeElement === 'WATER' ? 2 : 1.6;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = activeElement === 'WATER' ? 12 : 5;
    for (let x = 0; x < width; x += 2) {
      const i = Math.floor((x / width) * (samples.length - 1));
      const raw = (samples[i] - 128) / 128;
      const grain = activeElement === 'SAND' ? Math.sin(i * 1.71) * 0.035 : 0;
      const y = centerY + (raw + grain) * height * amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      if (activeElement === 'SAND' && i % 12 === 0) {
        ctx.moveTo(x, centerY - Math.abs(raw) * height * 0.16);
        ctx.lineTo(x, centerY + Math.abs(raw) * height * 0.16);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
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
