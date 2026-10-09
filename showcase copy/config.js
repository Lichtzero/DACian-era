/**
 * =========================================================================
 * READER — FIELD INSTRUMENT ARCHIVE CONFIGURATION
 * =========================================================================
 * 
 * This file contains all configurable parameters and URLs for the READER
 * documentation and onboarding website.
 * 
 * Edit the variables below to update connection URLs, creator info,
 * demonstration media, and simulation endpoints.
 */

window.READER_CONFIG = {
  // -----------------------------------------------------------------------
  // 1. SIMULATION ENDPOINT (CONTROLLED PROTOTYPE)
  // The main Launch Simulation destination linking to the deployed prototype
  // -----------------------------------------------------------------------
  SIMULATION_URL: "https://dacian-era.onrender.com",

  // Handheld Phone Reader direct link (used for QR code target)
  PHONE_READER_URL: "https://dacian-era.onrender.com/phone/",

  // Experimental Reader endpoint (independent exploratory field instrument)
  EXPERIMENTAL_READER_URL: "/simulation/experimental/",
  EXPERIMENTAL_RECEIVER_URL: "/simulation/experimental/receiver.html",

  // -----------------------------------------------------------------------
  // 2. CREATOR / MAKER INFORMATION
  // -----------------------------------------------------------------------
  CREATOR: {
    NAME: "Aabha Wagh",
    ROLE: "Speculative Designer & Systems Researcher",
    INSTITUTION: "Masters of Design in Human Centered Design",
    PORTFOLIO_URL: "[DESIGN PRACTICE / WEBSITE / PORTFOLIO]",
    BIO: `Focused on human-centred design, design research, systems, perception, speculative worlds, and invisible interactions between people, materials, and environments.`
  },

  // -----------------------------------------------------------------------
  // 3. DEMO VIDEO CONFIGURATION
  // Place your video path or stream URL here.
  // Can be a local file path relative to this project, an absolute file, or an embed link.
  // -----------------------------------------------------------------------
  DEMO_VIDEO: {
    URL: "[DEMO VIDEO URL]", // e.g. "assets/demo-video.mp4" or "https://player.vimeo.com/..."
    POSTER_IMAGE: "",        // Optional thumbnail image
    TITLE: "Field Demonstration DAC-04 — Full Operational Cycle",
    DURATION: "03:42"
  },

  // -----------------------------------------------------------------------
  // 4. QR CODE CONFIGURATION
  // Set whether to generate a live QR code for PHONE_READER_URL or show placeholder
  // -----------------------------------------------------------------------
  QR_CODE: {
    SHOW_LIVE_QR: true,
    PLACEHOLDER_TEXT: "[ READER QR CODE ]",
    HELP_TEXT: "Scan with your handheld smartphone to access the DAC-04 Reader instrument."
  },

  // -----------------------------------------------------------------------
  // 5. ARCHIVAL METADATA & FIELD SPECS
  // -----------------------------------------------------------------------
  ARCHIVE_METADATA: {
    SYSTEM_ID: "DAC-04",
    SERIES: "FIELD INSTRUMENT ARCHIVE",
    CLASSIFICATION: "DE-COMMISSIONED FIELD RECORD // SPECULATIVE ARTIFACT",
    DEFAULT_FREQUENCY: 240,
    FREQUENCY_RANGE: [80, 1200],
    CURRENT_FIELDS: [
      {
        id: "FIELD-01",
        name: "WATER",
        directive: "FOLLOW THE CURRENT",
        medium: "Submerged silt, hydrophone resonant nodes, aqueous memory",
        baseFreq: 440,
        bandwidth: 120
      },
      {
        id: "FIELD-02",
        name: "SAND",
        directive: "FOLLOW THE RESIDUE",
        medium: "Granular quartz, friction resonance, shifting foundation",
        baseFreq: 820,
        bandwidth: 160
      }
    ]
  }
};
