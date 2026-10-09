/**
 * =========================================================================
 * READER ARCHIVE — MAIN CLIENT ENGINE
 * =========================================================================
 * Initializes config bindings, URL parameters, interactive navigation,
 * QR code rendering, and modal controllers.
 */

document.addEventListener('DOMContentLoaded', () => {
  const config = window.READER_CONFIG || {
    SIMULATION_URL: 'http://localhost:8787/laptop/',
    PHONE_READER_URL: 'http://localhost:8787/phone/',
    CREATOR: {
      NAME: '[CREATOR NAME]',
      ROLE: 'Speculative Designer & Systems Researcher',
      INSTITUTION: '[PROGRAM / INSTITUTION]',
      PORTFOLIO_URL: '[DESIGN PRACTICE / WEBSITE / PORTFOLIO]',
      BIO: '[CREATOR BIO: Focused on human-centred design, design research, systems, perception, speculative worlds, and invisible interactions between people, materials, and environments.]'
    },
    DEMO_VIDEO: {
      URL: '[DEMO VIDEO URL]'
    }
  };

  // -----------------------------------------------------------------------
  // 1. BIND SIMULATION URLs TO BUTTONS & LINKS
  // -----------------------------------------------------------------------
  function updateSimulationLinks() {
    const simUrl = config.SIMULATION_URL || 'https://dacian-era.onrender.com';
    const phoneUrl = config.PHONE_READER_URL || 'https://dacian-era.onrender.com/phone/';
    const expUrl = config.EXPERIMENTAL_READER_URL || '/simulation/experimental/';
    const expRecUrl = config.EXPERIMENTAL_RECEIVER_URL || '/simulation/experimental/receiver.html';

    // Enter Controlled Simulation CTA buttons
    document.querySelectorAll('.js-enter-sim-btn').forEach((btn) => {
      btn.setAttribute('href', simUrl);
      if (simUrl.startsWith('http')) {
        btn.setAttribute('target', '_blank');
        btn.setAttribute('rel', 'noopener noreferrer');
      }
    });

    // Enter Experimental Field Reader CTA buttons
    document.querySelectorAll('.js-experimental-sim-btn').forEach((btn) => {
      btn.setAttribute('href', expUrl);
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener noreferrer');
    });

    // Enter Experimental Laptop Receiver CTA buttons
    document.querySelectorAll('.js-experimental-receiver-btn').forEach((btn) => {
      btn.setAttribute('href', expRecUrl);
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener noreferrer');
    });

    // Display elements showing the current simulation URL
    document.querySelectorAll('.js-sim-url-display').forEach((el) => {
      el.textContent = simUrl;
    });

    // Display elements showing the phone reader URL
    document.querySelectorAll('.js-phone-url-display').forEach((el) => {
      el.textContent = phoneUrl;
    });

    // Display elements showing experimental URL
    document.querySelectorAll('.js-exp-url-display').forEach((el) => {
      el.textContent = expUrl;
    });
  }

  updateSimulationLinks();

  // -----------------------------------------------------------------------
  // 2. BIND CREATOR PLACEHOLDERS
  // -----------------------------------------------------------------------
  function bindCreatorInfo() {
    const creator = config.CREATOR || {};
    const nameEl = document.querySelector('#creator-name-display');
    const roleEl = document.querySelector('#creator-role-display');
    const instEl = document.querySelector('#creator-inst-display');
    const bioEl = document.querySelector('#creator-bio-display');
    const portEl = document.querySelector('#creator-portfolio-link');

    if (nameEl && creator.NAME) nameEl.textContent = creator.NAME;
    if (roleEl && creator.ROLE) roleEl.textContent = creator.ROLE;
    if (instEl && creator.INSTITUTION) instEl.textContent = creator.INSTITUTION;
    if (bioEl && creator.BIO) bioEl.textContent = creator.BIO;
    if (portEl && creator.PORTFOLIO_URL) {
      portEl.textContent = creator.PORTFOLIO_URL;
      if (creator.PORTFOLIO_URL.startsWith('http')) {
        portEl.href = creator.PORTFOLIO_URL;
      }
    }
  }

  bindCreatorInfo();

  // -----------------------------------------------------------------------
  // 3. QR CODE GENERATION & PLACEHOLDER HANDLING
  // -----------------------------------------------------------------------
  function setupQRCode() {
    const qrCanvas = document.querySelector('#qr-code-canvas');
    const qrPlaceholder = document.querySelector('#qr-placeholder-text');
    const phoneUrl = config.PHONE_READER_URL || 'http://localhost:8787/phone/';

    if (qrCanvas) {
      // Draw clean archival matrix graphic
      const ctx = qrCanvas.getContext('2d');
      const size = 180;
      qrCanvas.width = size;
      qrCanvas.height = size;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Render stylized field barcode / matrix pattern
      ctx.fillStyle = '#1c1a17';
      const matrixSize = 25;
      const cellSize = size / matrixSize;

      // Deterministic seed based on URL string
      let seed = 0;
      for (let i = 0; i < phoneUrl.length; i++) {
        seed = (seed * 31 + phoneUrl.charCodeAt(i)) % 100000;
      }

      // Draw standard corner registration anchors
      function drawFinder(r, c) {
        for (let i = 0; i < 7; i++) {
          for (let j = 0; j < 7; j++) {
            if (
              i === 0 ||
              i === 6 ||
              j === 0 ||
              j === 6 ||
              (i >= 2 && i <= 4 && j >= 2 && j <= 4)
            ) {
              ctx.fillRect((c + j) * cellSize, (r + i) * cellSize, cellSize, cellSize);
            }
          }
        }
      }

      drawFinder(1, 1);
      drawFinder(1, matrixSize - 8);
      drawFinder(matrixSize - 8, 1);

      // Fill data cells
      for (let r = 0; r < matrixSize; r++) {
        for (let c = 0; c < matrixSize; c++) {
          // Skip finder zones
          if (
            (r < 9 && c < 9) ||
            (r < 9 && c > matrixSize - 10) ||
            (r > matrixSize - 10 && c < 9)
          ) {
            continue;
          }

          seed = (seed * 9301 + 49297) % 233280;
          if (seed / 233280 > 0.5) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    // Quick copy button for phone URL
    const copyBtn = document.querySelector('#copy-phone-url-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(phoneUrl).then(() => {
          const original = copyBtn.textContent;
          copyBtn.textContent = 'COPIED TO CLIPBOARD';
          setTimeout(() => {
            copyBtn.textContent = original;
          }, 2000);
        });
      });
    }
  }

  setupQRCode();

  // -----------------------------------------------------------------------
  // 4. DEMO VIDEO INTERACTIVE STAGES
  // -----------------------------------------------------------------------
  const demoStages = [
    {
      num: '01',
      name: 'CONNECT',
      desc: 'Pairing the handheld Reader to the laptop Field Receiver via WebSocket relay.'
    },
    {
      num: '02',
      name: 'SELECT',
      desc: 'Selecting environmental field: Water (submerged current) or Sand (shifting residue).'
    },
    {
      num: '03',
      name: 'LISTEN',
      desc: 'Tuning the frequency slider through ambient noise until carrier harmonics emerge.'
    },
    {
      num: '04',
      name: 'LOCATE',
      desc: 'Stabilizing proximity until the LOCATE FILLÁMEND control triggers.'
    },
    {
      num: '05',
      name: 'MEND',
      desc: 'Engaging physical touch repair to reconstruct the fragmented acoustic message.'
    },
    {
      num: '06',
      name: 'OBSERVE',
      desc: 'Typing qualitative sensory field notes on the keypad to log the permanent telemetry.'
    }
  ];

  const demoStageContainer = document.querySelector('#demo-stage-timeline');
  const demoStageDesc = document.querySelector('#demo-stage-description');

  if (demoStageContainer) {
    demoStageContainer.innerHTML = demoStages
      .map(
        (st, idx) => `
        <div class="demo-stage-step ${idx === 0 ? 'active' : ''}" data-idx="${idx}" style="cursor: pointer;">
          <span style="font-weight: 700;">STAGE ${st.num}</span>
          <span>${st.name}</span>
        </div>
      `
      )
      .join('');

    demoStageContainer.addEventListener('click', (e) => {
      const step = e.target.closest('.demo-stage-step');
      if (!step) return;

      const idx = parseInt(step.dataset.idx, 10);
      demoStageContainer
        .querySelectorAll('.demo-stage-step')
        .forEach((s) => s.classList.remove('active'));
      step.classList.add('active');

      if (demoStageDesc) {
        demoStageDesc.textContent = `${demoStages[idx].num} — ${demoStages[idx].name}: ${demoStages[idx].desc}`;
      }
    });
  }

  // -----------------------------------------------------------------------
  // 5. IN-PAGE CONFIGURATION MODAL (QUICK URL SWITCHER)
  // -----------------------------------------------------------------------
  const configModal = document.querySelector('#config-modal');
  const configTrigger = document.querySelector('#open-config-btn');
  const configClose = document.querySelector('#close-config-btn');
  const simInput = document.querySelector('#modal-sim-url-input');
  const phoneInput = document.querySelector('#modal-phone-url-input');
  const configSave = document.querySelector('#save-config-btn');

  if (configTrigger && configModal) {
    configTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (simInput) simInput.value = config.SIMULATION_URL;
      if (phoneInput) phoneInput.value = config.PHONE_READER_URL;
      configModal.style.display = 'flex';
    });

    if (configClose) {
      configClose.addEventListener('click', () => {
        configModal.style.display = 'none';
      });
    }

    if (configSave) {
      configSave.addEventListener('click', () => {
        if (simInput) config.SIMULATION_URL = simInput.value.trim();
        if (phoneInput) config.PHONE_READER_URL = phoneInput.value.trim();
        updateSimulationLinks();
        setupQRCode();
        configModal.style.display = 'none';
      });
    }

    configModal.addEventListener('click', (e) => {
      if (e.target === configModal) configModal.style.display = 'none';
    });
  }

 // -----------------------------------------------------------------------
  // 6. JAVASCRIPT SMOOTH SCROLLING & ACTIVE NAVIGATION OBSERVER
  // -----------------------------------------------------------------------
  const navLinks = document.querySelectorAll('.nav-link, .archive-footer a[href^="#"], .brand-sigil');
  const sections = document.querySelectorAll('section[id], div#top');

  // Intercept clicks to scroll smoothly without adding hashes to the URL
  document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('[data-target]');
    if (!targetLink) return;

    e.preventDefault();
    const targetId = targetLink.getAttribute('data-target');
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Highlight active link on scroll
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          document.querySelectorAll('.nav-link').forEach((link) => {
            const target = link.getAttribute('data-target');
            link.classList.toggle('active', target === id);
          });
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  sections.forEach((sec) => navObserver.observe(sec));

  // Initialize modular engines
  if (window.FIRST_FIELD_TUTORIAL) window.FIRST_FIELD_TUTORIAL.init();
  if (window.FIELD_CHECKLIST) window.FIELD_CHECKLIST.init();
  if (window.FIELD_NOTES) window.FIELD_NOTES.init();
});
