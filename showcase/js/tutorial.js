/**
 * =========================================================================
 * FIRST FIELD TUTORIAL — STEP-BY-STEP ONBOARDING ENGINE
 * =========================================================================
 * Powers the interactive 8-step tutorial for first-time visitors
 * approaching the READER instrument.
 */

window.FIRST_FIELD_TUTORIAL = (function () {
  const stepsData = [
    {
      step: '01',
      id: 'prepare',
      title: 'PREPARE',
      summary: 'Assemble your dual-terminal field station.',
      quote: 'The instrument operates through co-presence: a monitoring surface and a handheld sensor.',
      contentHtml: `
        <p class="step-text">Before approaching the field, verify you have the physical equipment required for the interaction. The READER requires two surfaces acting in concert:</p>
        <div class="equipment-two-columns">
          <div class="equip-col">
            <span class="equip-label">PRIMARY STATION / MONITOR</span>
            <strong class="equip-name">Laptop Terminal</strong>
            <ul class="equip-bullets">
              <li>Displays the <strong>FIELD RECEIVER</strong> environment</li>
              <li>Visualizes the cymatic fluid particle field</li>
              <li>Monitors system telemetry and observation logs</li>
              <li>Modern web browser (Chrome, Safari, Firefox, Edge)</li>
            </ul>
          </div>
          <div class="equip-col">
            <span class="equip-label">FIELD INSTRUMENT / SENSOR</span>
            <strong class="equip-name">Handheld Smartphone</strong>
            <ul class="equip-bullets">
              <li>Acts as the physical <strong>READER</strong> device in hand</li>
              <li><strong>Audio Enabled:</strong> volume set to an audible level</li>
              <li><strong>Vibration Enabled:</strong> haptic feedback indicates resonance</li>
              <li>Connected via local network / Wi-Fi or Web link</li>
            </ul>
          </div>
        </div>
      `
    },
    {
      step: '02',
      id: 'connect',
      title: 'CONNECT',
      summary: 'Pair the handheld instrument to the field receiver.',
      quote: 'Once linked, the phone becomes the antenna and the laptop becomes the horizon.',
      contentHtml: `
        <p class="step-text">The handheld READER pairs directly to the active field receiver. Scan the access symbol with your smartphone camera to establish the link:</p>
        <div class="tutorial-qr-placeholder-box">
          <div class="tutorial-qr-symbol">[ READER QR CODE ]</div>
          <p class="tutorial-qr-caption">Scan the QR code with your phone to access the field instrument.</p>
          <span class="tutorial-qr-meta">LINK PROTOCOL: WEBSOCKET / LOCAL RELAY 8787</span>
        </div>
        <p class="step-text">Once connected, the status on both terminals shifts from <code>STANDBY</code> to <code>LINKED</code>. The handheld instrument now controls the field receiver's auditory and visual window.</p>
      `
    },
    {
      step: '03',
      id: 'select',
      title: 'SELECT A FIELD',
      summary: 'Choose the environmental medium to investigate.',
      quote: 'Information in this world does not exist in an abstract vacuum; it is soaked into clay or trapped in quartz.',
      contentHtml: `
        <p class="step-text">The speculative archive contains multiple environmental layers. Choose which environment to calibrate:</p>
        <div class="fields-dual-grid">
          <div class="field-choice-card water">
            <div class="field-choice-title">FIELD 01 / WATER</div>
            <div class="field-choice-directive">FOLLOW THE CURRENT</div>
            <p class="field-choice-text">A shallow body of water covers the remains of a submerged settlement. Signals move like currents beneath the surface. Deep hydrophone frequencies and muffled acoustic traces.</p>
          </div>
          <div class="field-choice-card sand">
            <div class="field-choice-title">FIELD 02 / SAND</div>
            <div class="field-choice-directive">FOLLOW THE RESIDUE</div>
            <p class="field-choice-text">Wind has exposed fragments of an ancient structure. Fine quartz grains shift over dormant nodes. Friction-based resonance, dry granular crackles, and buried speech harmonics.</p>
          </div>
        </div>
      `
    },
    {
      step: '04',
      id: 'listen',
      title: 'LISTEN',
      summary: 'Search through frequency rather than a conventional map.',
      quote: 'Move through the frequency range and attend to changes in the signal.',
      contentHtml: `
        <p class="step-text">You do not navigate the field by clicking a geographic map. You navigate by sweeping frequency ranges:</p>
        <ul class="step-bullets">
          <li><strong>FLOW / FREQUENCY SLIDER:</strong> Shifts the base search band across the spectrum (80 Hz to 1200 Hz).</li>
          <li><strong>DEPTH / BAND SLIDER:</strong> Widens or narrows the acoustic filter window.</li>
          <li><strong>LISTEN TOGGLE:</strong> Engages the acoustic transducer. Pay close attention to subtle shifts in the drone, rhythmic pulses, and buried voices.</li>
        </ul>
        <div class="archival-notice">
          <strong>OPERATIONAL RULE:</strong> Do not assume the loudest sound is the target. The DACian signal often rests just below obvious acoustic noise.
        </div>
      `
    },
    {
      step: '05',
      id: 'follow',
      title: 'FOLLOW',
      summary: 'Interpret multi-sensory navigational cues.',
      quote: 'The instrument speaks through sound, vibration, and proximity.',
      contentHtml: `
        <p class="step-text">As you adjust the frequency and rotate the handheld device, the READER provides three layers of feedback:</p>
        <div class="feedback-three-cards">
          <div class="feedback-card">
            <span class="fb-tag">ACOUSTIC</span>
            <strong>Sound Clarity</strong>
            <p>Muffled textures clarify into distinct melodic or spoken fragments as you approach resonance.</p>
          </div>
          <div class="feedback-card">
            <span class="fb-tag">HAPTIC</span>
            <strong>Vibration Pulses</strong>
            <p>The handheld phone pulses faster and firmer when your frequency vector nears a buried node.</p>
          </div>
          <div class="feedback-card">
            <span class="fb-tag">CYMATIC</span>
            <strong>Visual Field</strong>
            <p>The laptop monitor's fluid particles reorganize into coherent geometric nodal rings.</p>
          </div>
        </div>
      `
    },
    {
      step: '06',
      id: 'locate',
      title: 'LOCATE',
      summary: 'Identify the buried fragment of embedded information.',
      quote: 'When resonance stabilizes, the fillámend emerges.',
      contentHtml: `
        <p class="step-text">When you believe you have locked onto the exact resonant frequency of a submerged node, the handheld instrument will illuminate the action:</p>
        <div class="locate-action-box">
          <span class="locate-badge">INSTRUMENT CONTROL</span>
          <div class="locate-title">LOCATE FILLÁMEND</div>
          <p class="locate-desc">A <em>fillámend</em> represents an authentic fragment of information embedded within the physical environment—a preserved thought, coordinate, or temporal trace.</p>
        </div>
        <p class="step-text">Pressing <strong>LOCATE FILLÁMEND</strong> freezes the drift and enters the recovery phase.</p>
      `
    },
    {
      step: '07',
      id: 'mend',
      title: 'MEND',
      summary: 'Interact with the damaged signal until it becomes readable.',
      quote: 'In the DACian world, information is not discarded when damaged; it is mended.',
      contentHtml: `
        <p class="step-text">Signals recovered from the field are rarely intact. They have degraded through water exposure, wind erosion, or mineral decay:</p>
        <div class="mend-visual-box">
          <div class="mend-tag">REPAIR CYCLE</div>
          <p class="mend-text">You engage the <strong>MEND</strong> control on the phone Reader, carefully balancing the frequency and stabilizing the waveform until the fragmented message reconstructs itself into a coherent, readable transmission.</p>
        </div>
      `
    },
    {
      step: '08',
      id: 'observe',
      title: 'OBSERVE',
      summary: 'Record your field observation into the permanent archive.',
      quote: 'The act of recording is not passive documentation; it completes the retrieval.',
      contentHtml: `
        <p class="step-text">Once the fillámend has been stabilized, the Reader prompts you for field notes:</p>
        <div class="observe-box">
          <span class="obs-tag">FIELD LOG ENTRY</span>
          <p class="obs-question">WHAT DID YOU NOTICE?</p>
          <p class="obs-text">Type your sensory observations using the Reader's on-screen keyboard. What did you hear? What physical sensations or textures did the environment evoke?</p>
        </div>
        <p class="step-text">Press <strong>LOG OBSERVATION</strong>. Your entry transmits across the network and records directly into the Field Receiver's telemetry archive on the laptop.</p>
      `
    }
  ];

  let currentStepIndex = 0;

  function init() {
    renderTabs();
    renderActiveStep(0);
    bindEvents();
  }

  function renderTabs() {
    const navStrip = document.querySelector('#tutorial-nav-strip');
    if (!navStrip) return;

    navStrip.innerHTML = stepsData
      .map(
        (s, idx) => `
        <button class="step-tab ${idx === 0 ? 'active' : ''}" data-index="${idx}">
          STEP ${s.step} — ${s.title}
        </button>
      `
      )
      .join('');
  }

  function renderActiveStep(index) {
    currentStepIndex = index;
    const data = stepsData[index];
    const container = document.querySelector('#tutorial-active-card');
    if (!container) return;

    container.innerHTML = `
      <div class="step-header-row">
        <div>
          <div class="step-number-tag">STEP ${data.step} // 08</div>
          <h3 class="step-title-text">${data.title}</h3>
        </div>
        <div class="archival-badge alert">OPERATIONAL PROTOCOL</div>
      </div>

      <div class="field-fragment-quote">
        “${data.quote}”
        <span class="field-fragment-author">FIELD MANUAL SPECIFICATION // DAC-04</span>
      </div>

      <div class="step-body-content">
        ${data.contentHtml}
      </div>

      <div class="step-actions">
        <button class="step-btn-nav" id="step-prev-btn" ${index === 0 ? 'disabled' : ''}>
          ← PREVIOUS STEP
        </button>
        <span class="telemetry-val" style="align-self: center;">${index + 1} OF ${stepsData.length}</span>
        <button class="step-btn-nav" id="step-next-btn" ${index === stepsData.length - 1 ? 'disabled' : ''}>
          ${index === stepsData.length - 1 ? 'FINAL STEP' : 'NEXT STEP →'}
        </button>
      </div>
    `;

    // Update active tab button
    document.querySelectorAll('.step-tab').forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });

    // Re-bind prev/next
    const prevBtn = document.querySelector('#step-prev-btn');
    const nextBtn = document.querySelector('#step-next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentStepIndex > 0) renderActiveStep(currentStepIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentStepIndex < stepsData.length - 1) renderActiveStep(currentStepIndex + 1);
      });
    }
  }

  function bindEvents() {
    const navStrip = document.querySelector('#tutorial-nav-strip');
    if (!navStrip) return;

    navStrip.addEventListener('click', (e) => {
      const tab = e.target.closest('.step-tab');
      if (tab) {
        const idx = parseInt(tab.dataset.index, 10);
        renderActiveStep(idx);
      }
    });
  }

  return { init, renderActiveStep };
})();
