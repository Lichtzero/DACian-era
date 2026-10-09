# DACIAN ERA // Field Documentation, Case Study & Experimental Reader

> **An inquiry into speculative world-building, environmental listening, situated geography, and material traces.**

---

## 1. The Three Distinct Parts of the Project

This repository maintains a strict conceptual and architectural separation between three interrelated components:

### Part A: The DACian Era Website & Case Study
- **Entrypoint**: [`index.html`](file:///Users/aabhawagh/showcase%20copy/index.html) (served at `http://localhost:3000/`)
- **Aesthetic**: Inspired by the Noctra Observatory visual language—deep obsidian mineral tones (`#0a0c0f`), warm archival parchment typography (`#f2eee3`), cymatic wave modulations, and restrained terracotta/cyan accents.
- **Narrative Structure**: A 9-section editorial journey designed for first-time visitors:
  1. *Opening*: The Speculative Premise & Interactive Field Tuner
  2. *Why This World?*: Analogue materiality vs. ephemeral digital storage
  3. *The World and Its Concepts*: DACians, Fillámend, and sensory encounters
  4. *The Reader*: Handheld Phone vs. Laptop Field Receiver roles
  5. *How the Controlled Prototype Works*: Dual-device WebSocket sync, carrier sweeping, and repair loops
  6. *Research & Design Process*: Framing, material matrix, physical prototyping, and iteration notes
  7. *The Experimental Direction*: Unguided environmental listening, geographic exploration, and voluntary practice
  8. *Reflection & Open Questions*: Ecological listening and acoustic memory
  9. *About the Maker & References*: Credits for Aabha Wagh (M.Des Human Centered Design) and theoretical bibliography

### Part B: The Controlled Reader Prototype (Preserved)
- **Deployed URL**: [https://dacian-era.onrender.com/](https://dacian-era.onrender.com/)
- **Local Location**: `simulation/` (`laptop/`, `phone/`, `archive/`, `repair/`, `server.js`)
- **Preservation Status**: **STRICTLY PRESERVED**.
  - All original routes, carrier frequency sweeping (80–1200 Hz), preset WATER/SAND modes, repair mechanics, and WebSocket protocols remain 100% intact.
  - The website's primary **Launch Simulation** buttons link directly to the deployed Render instance.

### Part C: The New Experimental Reader
- **Mobile Field Instrument**: `simulation/experimental/index.html` (served at `http://localhost:3000/simulation/experimental/`)
- **Laptop Field Receiver**: `simulation/experimental/receiver.html` (served at `http://localhost:3000/simulation/experimental/receiver.html`)
- **Core Investigation**:
  - **Unguided Environmental Listening**: Uses real browser WebAudio API (`audio-engine.js`) for live microphone input, bandpass acoustic filtering, and real-time spectrum analysis.
  - **Voluntary Practice (WATER vs. SAND)**: Elements are voluntary choices of practice—WATER (continuous wave interference, fluid ripple dynamics) vs. SAND (granular drift, stratified erosion marks, friction chatter)—rather than physical environment detection.
  - **Situated Geography**: Built with Leaflet (`map-view.js`) and grounded in an authentic Indian geographic context (Pune Mula-Mutha river basin, Mutha confluence, and Deccan plateau).
  - **Anonymous Logging**: Contributor privacy by default (`filament-store.js`). Logs contain observations, timestamps, element choices, and voluntary explicit audio recordings.
  - **Proximity Encounters**: Haversine distance detection alert triggers when a user walks within 250m of an existing filament trace.
  - **Cartographic Archive Overview**: The laptop receiver displays density metrics, active ledgers, and untraced zone markers.

---

## 2. Directory Structure

```
showcase copy/
├── index.html                   # Main DACian Era website & 9-section case study
├── config.js                    # Centralized simulation URLs and maker metadata
├── server.js                    # Local static server with auto index.html resolution
├── package.json                 # Node scripts (start, sim, all)
├── README.md                    # Project documentation & setup instructions
├── assets/                      # Curated artifacts (reader-artifact.png, reader-device.png)
├── css/
│   ├── variables.css            # Deep mineral obsidian palette & typography tokens
│   ├── reset.css                # Base CSS resets
│   ├── typography.css           # Instrument typography (Cinzel, Inter, JetBrains Mono)
│   ├── layout.css               # Editorial grid, header blur, section layouts
│   ├── components.css           # Case study cards, plinths, comparison matrices
│   └── responsive.css           # Fluid mobile & tablet media queries
├── js/
│   ├── main.js                  # Website controller & modal bindings
│   ├── signal-canvas.js         # Interactive hero oscilloscope & wave simulator
│   ├── artifact.js              # Three.js interactive 3D artifact plinth
│   ├── tutorial.js              # Interactive onboarding stepper
│   ├── checklist.js             # Pre-flight deployment checklist
│   └── field-notes.js           # Filterable research archive cards
└── simulation/                  # Simulation root
    ├── server.js                # Controlled prototype HTTP/WS server (port 8787)
    ├── laptop/                  # Controlled Field Receiver (preserved)
    ├── phone/                   # Controlled Handheld Reader (preserved)
    ├── archive/                 # Controlled Archive logs (preserved)
    ├── repair/                  # Controlled waveform repair loop (preserved)
    └── experimental/            # NEW EXPERIMENTAL READER
        ├── index.html           # Phone-first field instrument
        ├── receiver.html        # Laptop cartographic receiver & ledger
        ├── css/
        │   └── experimental.css # Dark mineral mobile & desktop stylesheet
        └── js/
            ├── audio-engine.js  # WebAudio API, microphone input, analyser, MediaRecorder
            ├── geo-engine.js    # Foreground GPS, proximity alerts, Indian geo defaults
            ├── elements.js      # WATER vs SAND distinct visual & behavior engines
            ├── filament-store.js# Local + remote filament repository & seed data
            ├── map-view.js      # Leaflet map, pulsing SVG markers, gap indicators
            └── app.js           # Main field instrument state controller
```

---

## 3. How to Run Locally

### Prerequisites
- Node.js (v18+)

### Step-by-Step Instructions

1. **Start the Website and Experimental Reader**:
   ```bash
   npm start
   ```
   This launches `server.js` on port 3000.
   - **Website & Case Study**: [http://localhost:3000](http://localhost:3000)
   - **Experimental Phone Reader**: [http://localhost:3000/simulation/experimental/](http://localhost:3000/simulation/experimental/)
   - **Experimental Laptop Receiver**: [http://localhost:3000/simulation/experimental/receiver.html](http://localhost:3000/simulation/experimental/receiver.html)

2. **Start the Controlled Prototype Server** (Optional for local testing):
   ```bash
   npm run sim
   ```
   This launches `simulation/server.js` on port 8787:
   - **Controlled Laptop Terminal**: [http://localhost:8787/laptop/](http://localhost:8787/laptop/)
   - **Controlled Phone Terminal**: [http://localhost:8787/phone/](http://localhost:8787/phone/)

3. **Run Both Servers Concurrently**:
   ```bash
   npm run all
   ```

---

## 4. Privacy, Permissions & Ethics

- **Microphone**: Live environmental audio analysis runs entirely client-side using the browser WebAudio API. No audio is ever recorded or uploaded without explicit, separate user initiation via the `[ RECORD AUDIO ]` control.
- **Location**: Geolocation requests occur strictly in the foreground upon user action. Background tracking is deliberately omitted. If denied, the application gracefully defaults to the Pune regional reference basin.
- **Anonymous Contribution**: Filaments do not require accounts, logins, or handles. Contributor identity is kept completely anonymous.
- **Data Retention**: Contributed filaments are stored locally in the browser's `localStorage` and can be deleted at any time through the filament detail view.

---

## 5. Credits & References

- **Creator**: Aabha Wagh (M.Des Human Centered Design, Srishti Manipal Institute of Art, Design and Technology)
- **Theoretical Grounding**:
  - Jussi Parikka, *A Geology of Media* (2015)
  - Shannon Mattern, *Code and Clay, Data and Dirt* (2017)
  - Bernie Krause, *The Great Animal Orchestra* (2012)
  - Steven Feld, *Acoustemology* (2015)
- **Visual Reference**: Noctra Observatory visual system
