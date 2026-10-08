# READER // Field Instrument DAC-04
### Official Field Documentation & Onboarding Manual

This repository contains the standalone archival documentation and onboarding website for **READER (DAC-04)**—an interactive speculative-world instrument for perceiving signals embedded within environmental substrates (water, silt, sand, quartz).

---

## Conceptual Overview

The website is designed as an **archival field-research manual and observational artifact from the speculative DACian world**, rather than a conventional portfolio page.

A first-time visitor experiences the following trajectory:
```
DISCOVER (The World of the DACians)
    ↓
UNDERSTAND (What is the READER instrument?)
    ↓
PREPARE (Dual-terminal setup: Laptop + Smartphone)
    ↓
LEARN (First Field 8-step interactive tutorial)
    ↓
ENTER (Crossing from documentation into the live simulation)
    ↓
INTERACT (Physical frequency sweep, listening, locating, mending, observing)
```

---

## Key Features & Architecture

1. **The World of the DACians (`#the-world`)**:
   - Observational field fragments exploring analogue information, physical substrates, and the ethics of repair.
   - Material matrix covering aqueous silt, quartz residue, alloy filaments, and cymatic media.

2. **Instrument Topology & Specifications (`#the-reader`)**:
   - Conceptual diagram illustrating the dual-terminal relationship:
     `FIELD RECEIVER (Laptop)` ↔ `SIGNAL` ↔ `READER (Handheld Phone)` ↔ `SENSORY FEEDBACK` ↔ `RESEARCHER PERCEPTION`.
   - Hardware role comparison table.

3. **First Field: Interactive Onboarding (`#first-field`)**:
   - Step 01: PREPARE (Dual terminals)
   - Step 02: CONNECT (Pairing via QR / local WebSocket relay)
   - Step 03: SELECT A FIELD (Field 01 Water vs Field 02 Sand)
   - Step 04: LISTEN (Frequency sweep navigation, 80 Hz to 1200 Hz)
   - Step 05: FOLLOW (Acoustic clarity, haptic pulses, cymatic particle formations)
   - Step 06: LOCATE (Triggering `LOCATE FILLÁMEND`)
   - Step 07: MEND (Physical touch repair of fragmented waveforms)
   - Step 08: OBSERVE (Logging sensory observations on the QWERTY keypad)

4. **Field Setup & Interactive Checklist (`#field-setup`)**:
   - Required vs. Recommended hardware breakdown.
   - Interactive, checkable pre-flight checklist with state saved in `localStorage`.

5. **Reader QR Access (`#qr-access`)**:
   - Visual access block with generated QR matrix and direct phone URL copy button.

6. **Field Demonstration (`#demonstration`)**:
   - Video player component with `[ DEMO VIDEO ]` placeholder and interactive 6-stage operational cycle breakdown.

7. **Field Notes & Research Archive (`#field-notes`)**:
   - Filterable research index cards covering `OBSERVATIONS`, `MATERIALS`, `SOUND`, `FREQUENCY`, `INTERACTION`, and `WORLD-BUILDING`.

8. **About the Maker (`#about-maker`)**:
   - Research dossier with clearly marked placeholders: `[CREATOR NAME]`, `[PROGRAM / INSTITUTION]`, `[DESIGN PRACTICE / WEBSITE / PORTFOLIO]`, and `[CREATOR BIO]`.

9. **Enter the Simulation (`#enter-simulation`)**:
   - Terminal transition: *"THE DOCUMENTATION ENDS HERE. THE FIELD BEGINS."*
   - Prominent **ENTER SIMULATION →** button powered by `SIMULATION_URL`.

10. **Interactive In-Page Oscilloscope & Tuner**:
    - HTML5 Canvas oscilloscope simulating carrier wave modulations and resonance lock at 440 Hz (Water) and 520 Hz (Sand).

---

## Quick Configuration

All connection endpoints, creator metadata, and media links are centralized in [`config.js`](file:///Users/aabhawagh/Desktop/sample/config.js):

```javascript
window.READER_CONFIG = {
  // 1. Destination when clicking "ENTER SIMULATION →"
  SIMULATION_URL: "http://localhost:8787/laptop/",

  // 2. Handheld Phone link (used for QR code target)
  PHONE_READER_URL: "http://localhost:8787/phone/",

  // 3. Creator information
  CREATOR: {
    NAME: "[CREATOR NAME]",                 // e.g. "Aabha Wagh"
    ROLE: "Speculative Designer & Systems Researcher",
    INSTITUTION: "[PROGRAM / INSTITUTION]",
    PORTFOLIO_URL: "[DESIGN PRACTICE / WEBSITE / PORTFOLIO]",
    BIO: `[CREATOR BIO]`
  },

  // 4. Demonstration video
  DEMO_VIDEO: {
    URL: "[DEMO VIDEO URL]"
  }
};
```

> **Live In-Page Config Switcher**: You can also click the **⚙ CONFIG** button in the top header of the website to dynamically test or switch `SIMULATION_URL` and `PHONE_READER_URL` directly in your browser without editing files.

---

## How to Run Locally

You can run the site using any static file server or Node.js:

```bash
# Start local server
npm start
```

Or run directly with Node:
```bash
node server.js
```

Open your browser to:
**`http://localhost:3000`**

Alternatively, you can open `index.html` directly in any modern web browser.

---

## Project Structure

```
sample/
├── index.html              # Main archival documentation application
├── config.js               # Central configuration file for URLs & metadata
├── server.js               # Zero-dependency local HTTP static server
├── package.json            # Node.js manifest
├── README.md               # Documentation & setup guide
├── css/
│   ├── variables.css       # Archival color tokens, typography & dimensions
│   ├── reset.css           # Modern box-sizing, typography resets
│   ├── typography.css      # Monospace, serif, stamp, and badge styling
│   ├── layout.css          # Archival page layout, sticky header, grids
│   ├── components.css      # Hero oscilloscope, tutorial, checklist, video
│   └── responsive.css      # Breakpoints for desktop, tablet, and mobile
└── js/
    ├── main.js             # Main controller, config binding, modal handling
    ├── signal-canvas.js    # Analogue oscilloscope & cymatic wave simulator
    ├── tutorial.js         # Interactive 8-step tutorial engine
    ├── checklist.js        # Interactive checklist with localStorage
    └── field-notes.js      # Filterable archival research cards
```
