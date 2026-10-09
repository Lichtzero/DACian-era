/* =========================================================
   READER — FIELD INSTRUMENT
   Sound / Frequency / Filament Perception System
   ========================================================= */

const READER_ID = 'DAC-04';
let READER_ELEMENT = 'WATER';
let myUsername = 'Tide-234';
let currentLiveRecordingBase64 = null;
let mediaRecorder = null;
let audioChunks = [];

/* =========================================================
   AUDIO / FREQUENCY SETTINGS
   ========================================================= */

const FREQUENCY_MIN = 180;
const FREQUENCY_MAX = 1160;

const INITIAL_VOICE_FREQUENCY = 742;

const FREQUENCY_TOLERANCE = 95;
const MEND_THRESHOLD = 0.78;

const NEAR_THRESHOLD = 28;
const ALIGN_THRESHOLD = 16;


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let ctx = null;
let master = null;

let running = false;
let starting = false;

let sources = [];
let transientSources = new Set();
let nodes = {};

let sessionId = 0;

let link = null;
let reconnectTimer = null;

let sensorsInitialized = false;
let currentHeading = null;

let observationPhase = false;

let displayedRadarAngle = 0;
let radarAnimationFrame = null;

let mendVibrationActive = false;
let mendVibrationTimer = null;

let mendCompleted = false;


/* =========================================================
   ENCOUNTER STATE
   ========================================================= */

const encounter = {
  number: 1,

  voiceFrequency: null,

  transmissions: [],
  activeTransmission: null,

  signalStrength: 0,
  signalIsolated: false,

  mended: false,

  filamentLocated: false,
  observationLogged: false
};


/* =========================================================
   NAVIGATION STATE
   ========================================================= */

const navigation = {
  active: false,

  targetBearing: null,
  difference: null,

  aligned: false,
  near: false,

  located: false
};


/* =========================================================
   DOM
   ========================================================= */

const freq = document.querySelector('#freq');
const band = document.querySelector('#band');

const freqValue = document.querySelector('#freqValue');

const status = document.querySelector('#status');
const meter = document.querySelector('#meterFill');

const listenButton = document.querySelector('#listen');

const instruction = document.querySelector('#instruction');
const statusMode = document.querySelector('#status-mode');

const commentBox = document.querySelector(
  '#phone-instruction-comment'
);

const input = document.querySelector('#logAttempt');
const logAttempt = document.querySelector('#logAttempt');

const recordButton = document.querySelector('#record');
const record = document.querySelector('#record');

const keypad = document.querySelector('#keypad');

const mendButton = document.querySelector('#mend');

const locateButton = document.querySelector(
  '#findFilament'
);

const radarContainer = document.querySelector(
  '#radar-container'
);

const radarNeedle = document.querySelector(
  '#radar-needle'
);

const headingDisplay = document.querySelector(
  '#heading-display'
);

const observationPanel = document.getElementById(
  'filament-observation'
);

const observationStatus = document.getElementById(
  'observation-status'
);


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function randomInt(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}


function normalizeHeading(value) {
  return (
    ((value % 360) + 360) % 360
  );
}


function shortestAngleDifference(
  current,
  target
) {
  return (
    ((target - current + 540) % 360) - 180
  );
}


/* =========================================================
   FREQUENCY GENERATION
   ========================================================= */

function generateVoiceFrequency(
  previousFrequency = null
) {

  if (previousFrequency === null) {
    return INITIAL_VOICE_FREQUENCY;
  }

  let next;

  do {
    next = randomInt(
      FREQUENCY_MIN,
      FREQUENCY_MAX
    );
  } while (
    Math.abs(
      next - previousFrequency
    ) < 140
  );

  return next;
}


/* =========================================================
   TRANSMISSION POOLS
   ========================================================= */

const WATER_TRANSMISSIONS = [
  'SOMETHING MOVES BENEATH THE SURFACE.',
  'THE CURRENT DOES NOT BEGIN WHERE YOU THINK.',
  'LISTEN BETWEEN THE FLOW.',
  'WHAT HOLDS WATER CLOSE TO YOU?',
  'THE SIGNAL IS THIN. MEND WHAT YOU HEAR.',
  'SEEK THE VESSEL THAT CARRIES A SMALL CURRENT.',
  'FOLLOW WHAT MOVES WITHOUT LEAVING.',
  'SOMETHING NEARBY REMEMBERS THE WATER.'
];


const SAND_TRANSMISSIONS = [
  'LISTEN FOR WHAT FALLS WITHOUT FALLING.',
  'THE GROUND REMEMBERS WHAT PASSES THROUGH IT.',
  'SOMETHING REMAINS AFTER THE WIND HAS LEFT.',
  'THE GROUND HOLDS MORE THAN IT REVEALS.',
  'SOME THINGS MOVE ONLY WHEN THEY ARE LEFT ALONE.',
  'THE SURFACE IS NOT THE WHOLE OF IT.',
  'LOOK FOR WHAT THE GROUND REFUSES TO KEEP.',
  'SOMETHING HAS BEEN BURIED WITHOUT BEING LOST.'
];


/* =========================================================
   CREATE TRANSMISSIONS
   ========================================================= */

function createTransmissions() {

  const pool =
    READER_ELEMENT === 'SAND'
      ? SAND_TRANSMISSIONS
      : WATER_TRANSMISSIONS;

  const offsets = [
    -430,
    -300,
    -205,
    -115,
    95,
    210,
    330,
    430
  ];

  const shuffled = [...pool]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  return shuffled.map(
    (text, index) => {

      return {
        id: index + 1,

        text,

        frequency:
          encounter.voiceFrequency +
          offsets[
            randomInt(
              0,
              offsets.length - 1
            )
          ]
      };

    }
  );
}


/* =========================================================
   ENCOUNTER CREATION
   ========================================================= */

function createEncounter(
  previousFrequency = null
) {

  encounter.voiceFrequency =
    generateVoiceFrequency(
      previousFrequency
    );

  encounter.transmissions =
    createTransmissions();

  encounter.activeTransmission = null;

  encounter.signalStrength = 0;
  encounter.signalIsolated = false;

  encounter.mended = false;

  encounter.filamentLocated = false;
  encounter.observationLogged = false;

  navigation.active = false;
  navigation.targetBearing = null;
  navigation.difference = null;
  navigation.aligned = false;
  navigation.near = false;
  navigation.located = false;

  observationPhase = false;

  /*
   * Reset MEND.
   */

  if (mendButton) {
    mendButton.classList.add('hidden');
    mendButton.disabled = true;
  }

  /*
   * Reset LOCATE FILAMENT.
   */

  if (locateButton) {
    locateButton.classList.add('hidden');
    locateButton.disabled = true;
  }

  /*
   * Reset radar.
   */

  if (radarContainer) {
    radarContainer.classList.add('hidden');
    radarContainer.classList.remove('visible');
  }

  /*
   * Reset observation controls,
   * but DO NOT hide the observation panel.
   */

  if (observationStatus) {
    observationStatus.textContent =
      'FILLÁMEND NOT LOCATED';
  }

  if (logAttempt) {
    logAttempt.value = '';
    logAttempt.readOnly = true;
  }

  if (record) {
    record.disabled = true;
  }

  /*
   * Debug information.
   */

  console.log(
    '[READER] New encounter:',
    encounter.number
  );

  console.log(
    '[READER] Hidden frequency:',
    encounter.voiceFrequency,
    'Hz'
  );

  console.log(
    '[READER] Transmissions:',
    encounter.transmissions
  );
}


/* =========================================================
   AUDIO SETUP
   ========================================================= */

async function loadAudioBuffer(url) {

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Could not load audio: ${url}`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  return await ctx.decodeAudioData(
    arrayBuffer
  );
}


/* =========================================================
   NOISE GENERATOR
   ========================================================= */

function createNoiseSource() {

  const bufferSize =
    ctx.sampleRate * 2;

  const buffer =
    ctx.createBuffer(
      1,
      bufferSize,
      ctx.sampleRate
    );

  const data =
    buffer.getChannelData(0);

  for (
    let i = 0;
    i < bufferSize;
    i++
  ) {
    data[i] =
      Math.random() * 2 - 1;
  }

  const source =
    ctx.createBufferSource();

  source.buffer = buffer;
  source.loop = true;

  return source;
}


/* =========================================================
   START LISTENING
   ========================================================= */

async function startListening() {

  if (starting) return;

  starting = true;

  try {

    await requestSensorPermission();

    if (!ctx) {

      ctx =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

      master =
        ctx.createGain();

      master.gain.value = 0.72;

      master.connect(
        ctx.destination
      );
    }

    if (
      ctx.state === 'suspended'
    ) {
      await ctx.resume();
    }

    /*
     * Clear previous audio sources.
     */

    stopAllSources();

    sources = [];
    transientSources.clear();
    nodes = {};

    /*
     * RAW BUS
     */

    const rawBus =
      ctx.createGain();

    rawBus.gain.value = 1;

    rawBus.connect(master);

    nodes.rawBus = rawBus;


    /* -----------------------------------------------------
       SEARCH FILTER
       ----------------------------------------------------- */

    const searchFilter =
      ctx.createBiquadFilter();

    searchFilter.type =
      'bandpass';

    searchFilter.frequency.value =
      Number(freq.value);

    searchFilter.Q.value =
      Number(band.value) / 100;

    const searchedGain =
      ctx.createGain();

    searchedGain.gain.value =
      0.18;

    searchFilter.connect(
      searchedGain
    );

    searchedGain.connect(
      master
    );

    nodes.searchFilter =
      searchFilter;

    nodes.searchedGain =
      searchedGain;


    /* -----------------------------------------------------
       HIDDEN VOICE
       ----------------------------------------------------- */

    const voiceBuffer =
      await loadAudioBuffer(
        './audio/hidden_voice_loop.wav'
      );

    const voiceSource =
      ctx.createBufferSource();

    voiceSource.buffer =
      voiceBuffer;

    voiceSource.loop = true;


    const voiceFilter =
      ctx.createBiquadFilter();

    voiceFilter.type =
      'bandpass';

    voiceFilter.frequency.value =
      encounter.voiceFrequency;

    voiceFilter.Q.value = 9;


    const voiceGain =
      ctx.createGain();

    voiceGain.gain.value =
      0.001;


    voiceSource.connect(
      voiceFilter
    );

    voiceFilter.connect(
      voiceGain
    );

    voiceGain.connect(
      rawBus
    );

    nodes.voiceSource =
      voiceSource;

    nodes.voiceFilter =
      voiceFilter;

    nodes.voiceGain =
      voiceGain;


    /* -----------------------------------------------------
       WATER AMBIENCE
       ----------------------------------------------------- */

    const ambience =
      createNoiseSource();

    const ambienceFilter =
      ctx.createBiquadFilter();

    ambienceFilter.type =
      'lowpass';

    ambienceFilter.frequency.value =
      700;

    const ambienceGain =
      ctx.createGain();

    ambienceGain.gain.value =
      READER_ELEMENT === 'SAND'
        ? 0.025
        : 0.035;

    ambience.connect(
      ambienceFilter
    );

    ambienceFilter.connect(
      ambienceGain
    );

    ambienceGain.connect(
      master
    );

    nodes.ambience =
      ambience;


    /* -----------------------------------------------------
       START SOURCES
       ----------------------------------------------------- */

    voiceSource.start();
    ambience.start();

    sources.push(
      voiceSource,
      ambience
    );

    running = true;

    status.textContent =
      'LISTENING';

    listenButton.textContent =
      'LISTENING';

    if (statusMode) {
      statusMode.textContent =
        'LISTENING';
    }

    sendLink({
      type: 'LISTEN',
      reader: READER_ID,
      element: READER_ELEMENT,
      encounter: encounter.number
    });

    update();

    scheduleDrops();

  } catch (error) {

    console.error(
      '[READER] Audio start error:',
      error
    );

    commentBox.textContent =
      'AUDIO SYSTEM ERROR. CHECK CONNECTION.';

  } finally {

    starting = false;
  }
}


/* =========================================================
   STOP LISTENING
   ========================================================= */

function stopListening() {

  running = false;

  stopAllSources();

  navigation.active = false;
  navigation.aligned = false;
  navigation.near = false;
  navigation.difference = null;

  if (radarContainer) {
    radarContainer.classList.add('hidden');
    radarContainer.classList.remove('visible');
    radarContainer.classList.remove('near');
    radarContainer.classList.remove('aligned');
  }

  if (locateButton) {
    locateButton.classList.add('hidden-control');
    locateButton.classList.add('hidden');
    locateButton.disabled = true;
  }

  status.textContent =
    'STANDBY';

  listenButton.textContent =
    'LISTEN';

  if (statusMode) {
    statusMode.textContent =
      'SEARCHING';
  }

  if (nodes.voiceGain && ctx) {

    try {
      nodes.voiceGain.gain.setTargetAtTime(
        0.001,
        ctx.currentTime,
        0.03
      );
    } catch (error) {}
  }

  sendLink({
    type: 'STOP',
    reader: READER_ID,
    element: READER_ELEMENT,
    encounter: encounter.number
  });
}


/* =========================================================
   STOP ALL AUDIO SOURCES
   ========================================================= */

function stopAllSources() {

  sources.forEach(
    source => {

      try {
        source.stop();
      } catch (error) {}

      try {
        source.disconnect();
      } catch (error) {}

    }
  );
    // Stop navigation display when listening stops
  navigation.active = false;
  navigation.aligned = false;
  navigation.near = false;
  navigation.difference = null;

  if (radarContainer) {
    radarContainer.classList.add('hidden');
    radarContainer.classList.remove('visible');
  }

  if (locateButton) {
    locateButton.classList.add('hidden');
    locateButton.disabled = true;
  }

  sources = [];

  transientSources.forEach(
    source => {

      try {
        source.stop();
      } catch (error) {}

      try {
        source.disconnect();
      } catch (error) {}

    }
  );

  transientSources.clear();
}

/* =========================================================
   CONTINUOUS MEND VIBRATION
   ========================================================= */

function startMendVibration() {

  if (
    mendVibrationActive ||
    !('vibrate' in navigator)
  ) {
    return;
  }

  mendVibrationActive = true;

  /*
   * Start immediately.
   */
  navigator.vibrate(180);

  /*
   * Keep restarting the vibration.
   * This creates the continuous buzz.
   */
  mendVibrationTimer =
    setInterval(() => {

      if (!mendVibrationActive) {
        return;
      }

      navigator.vibrate(180);

    }, 200);
}


function stopMendVibration() {

  mendVibrationActive = false;

  if (mendVibrationTimer) {

    clearInterval(
      mendVibrationTimer
    );

    mendVibrationTimer = null;
  }

  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}
/* =========================================================
   FREQUENCY MATCHING
   ========================================================= */

/* =========================================================
   FREQUENCY MATCHING
   ========================================================= */

/* =========================================================
   FREQUENCY MATCHING
   ========================================================= */

function checkHiddenVoiceMatch() {

  if (
    !running ||
    !encounter.voiceFrequency
  ) {
    return;
  }

  const currentFreq =
    Number(freq.value);

  const signalStrength =
    Math.max(
      0,
      1 -
        Math.abs(
          currentFreq -
          encounter.voiceFrequency
        ) /
          FREQUENCY_TOLERANCE
    );

  encounter.signalStrength =
    signalStrength;


  if (meter) {

    meter.style.width =
      `${Math.round(
        signalStrength * 100
      )}%`;
  }


  /* =======================================================
     SIGNAL DETECTED
     ======================================================= */

  if (
  signalStrength >= MEND_THRESHOLD &&
  !encounter.mended &&
  !mendCompleted
)  {

    /*
     * IMPORTANT:
     * Every time the frequency enters the range,
     * signalIsolated becomes true again.
     */

    encounter.signalIsolated =
      true;


    /*
     * START / CONTINUE CONSTANT VIBRATION
     */

    startMendVibration();


    /*
     * SHOW MEND
     */

    if (mendButton) {

      mendButton.classList.remove(
        'hidden'
      );

      mendButton.disabled =
        false;
    }
    else {
  stopMendVibration();
    }


    if (!encounter.mended) {

      commentBox.textContent =
        'SIGNAL ISOLATED. MEND WHAT YOU HEAR.';
    }


    console.log(
      '[READER] SIGNAL DETECTED:',
      currentFreq,
      'Hz | strength:',
      signalStrength
    );

  }


  /* =======================================================
     SIGNAL LOST
     ======================================================= */

  else {

    /*
     * Leaving the frequency range stops the buzz.
     */

    encounter.signalIsolated =
      false;

    stopMendVibration();


    if (
      mendButton &&
      !encounter.mended
    ) {

      mendButton.classList.add(
        'hidden'
      );

      mendButton.disabled =
        true;
    }


    if (!encounter.mended) {

      commentBox.textContent =
        'Scanning frequencies... Adjust to find resonance.';
    }
  }
}


/* =========================================================
   MEND SIGNAL
   ========================================================= */

/* =========================================================
   MEND SIGNAL
   ========================================================= */

function mendSignal() {

  // Stop the continuous vibration immediately
  stopMendVibration();

  // Safety checks
  if (!running) {
    return;
  }

  if (!encounter.signalIsolated) {
    return;
  }

  if (encounter.mended) {
    return;
  }

  // Mark MEND as completed
  encounter.mended = true;
  mendCompleted = true;

  // Hide MEND button
  if (mendButton) {
    mendButton.classList.add('hidden');
    mendButton.disabled = true;
  }

  // Find the transmission closest to the hidden voice
  const transmission = encounter.transmissions
    .slice()
    .sort(function(a, b) {
      return (
        Math.abs(a.frequency - encounter.voiceFrequency) -
        Math.abs(b.frequency - encounter.voiceFrequency)
      );
    })[0];

  encounter.activeTransmission = transmission || null;

  // Show the recovered transmission
  if (commentBox) {
    commentBox.textContent =
      encounter.activeTransmission
        ? encounter.activeTransmission.text
        : 'THE SIGNAL HAS BEEN MENDED.';
  }

  // Activate radar
  activateRadar();

  // Tell laptop / Field Receiver
  sendLink({
    type: 'MEND',
    reader: READER_ID,
    element: READER_ELEMENT,
    encounter: encounter.number,
    frequency: Number(freq.value),
    voiceFrequency: encounter.voiceFrequency,
    transmission: encounter.activeTransmission
      ? encounter.activeTransmission.text
      : null
  });

  // Update instruction
  updateInstruction();
}


/* =========================================================
   INSTRUCTION STATE
   ========================================================= */

function updateInstruction() {

  if (!instruction) {
    return;
  }


  if (observationPhase) {

    instruction.textContent =
      'LOG WHAT YOU NOTICED';

    return;
  }


  if (encounter.filamentLocated) {

    instruction.textContent =
      'LOG WHAT YOU NOTICED';

    return;
  }


  if (navigation.active) {

    if (navigation.aligned) {

      instruction.textContent =
        'FILLÁMEND IN RANGE';

    } else if (navigation.near) {

      instruction.textContent =
        'SOMETHING IS NEARBY';

    } else {

      instruction.textContent =
        'FOLLOW THE BEARING';
    }

    return;
  }


  if (encounter.mended) {

    instruction.textContent =
      'FOLLOW THE BEARING';

    return;
  }


  instruction.textContent =
    'FOLLOW THE CURRENT';
}


/* =========================================================
   ACTIVATE RADAR
   ========================================================= */

function activateRadar() {

  /*
   * Capture the current heading.
   */

  const baseHeading =
    currentHeading ?? 0;


  /*
   * Choose a completely new
   * direction across 360°.
   */

  const relativeAngle =
    Math.random() * 360;


  navigation.targetBearing =
    normalizeHeading(
      baseHeading +
      relativeAngle
    );


  navigation.active =
    true;

  navigation.located =
    false;

  navigation.aligned =
    false;

  navigation.near =
    false;


  /*
   * Show radar.
   */

  if (radarContainer) {

    radarContainer.classList.remove(
      'hidden'
    );

    radarContainer.classList.add(
      'visible'
    );
  }


  if (statusMode) {

    statusMode.textContent =
      'NAVIGATING';
  }


  commentBox.textContent =
    'FOLLOW THE BEARING.';


  console.log(
    '[READER] Navigation activated.'
  );

  console.log(
    '[READER] Current heading:',
    currentHeading
  );

  console.log(
    '[READER] Target bearing:',
    navigation.targetBearing
  );


  updateNavigation();


  sendLink({
    type: 'NAVIGATION',

    reader: READER_ID,

    element: READER_ELEMENT,

    encounter: encounter.number,

    active: true,

    targetBearing:
      navigation.targetBearing
  });


  updateInstruction();
}


/* =========================================================
   NAVIGATION UPDATE
   ========================================================= */

function updateNavigation() {

  if (
    !navigation.active ||
    navigation.targetBearing === null ||
    currentHeading === null
  ) {
    return;
  }


  const difference =
    shortestAngleDifference(
      currentHeading,
      navigation.targetBearing
    );


  navigation.difference =
    difference;


  const absoluteDifference =
    Math.abs(difference);


  navigation.near =
    absoluteDifference <=
    NEAR_THRESHOLD;


  navigation.aligned =
    absoluteDifference <=
    ALIGN_THRESHOLD;


  updateRadarUI();


  if (
    navigation.aligned &&
    !encounter.filamentLocated
  ) {

    commentBox.textContent =
      'BEARING ALIGNED. LOCATE THE FILLÁMEND.';
  }

  else if (
    navigation.near &&
    !encounter.filamentLocated
  ) {

    commentBox.textContent =
      'THE FIELD IS BEGINNING TO GLITCH.';
  }


  updateInstruction();
}


/* =========================================================
   RADAR UI
   ========================================================= */

function updateRadarUI() {

  if (
    !radarNeedle ||
    navigation.targetBearing === null
  ) {
    return;
  }

  const heading =
    currentHeading ?? 0;

  const relative =
    shortestAngleDifference(
      heading,
      navigation.targetBearing
    );

  navigation.difference =
    relative;

  /*
   * The target can exist anywhere
   * around the full 360°.
   *
   * The radar is only a 180° window.
   *
   * If the target is behind us,
   * keep the arrow at the appropriate
   * edge rather than making it disappear.
   */

  const radarAngle =
    Math.max(
      -88,
      Math.min(88, relative)
    );

  /*
   * Smooth compass-like movement.
   */

  radarNeedle.style.transform =
    `rotate(${radarAngle}deg)`;

  radarNeedle.style.opacity = '1';

  if (headingDisplay) {

    headingDisplay.textContent =
      `BEARING: ${String(
        Math.round(
          navigation.targetBearing
        )
      ).padStart(3, '0')}°`;
  }

  /*
   * Existing FILLÁMEND proximity behaviour.
   */

  if (radarContainer) {

    radarContainer.classList.toggle(
      'near',
      navigation.near
    );

    radarContainer.classList.toggle(
      'aligned',
      navigation.aligned
    );
  }

  /*
   * LOCATE becomes available when
   * the player is sufficiently aligned.
   */

  if (
    locateButton &&
    navigation.active &&
    navigation.aligned &&
    !encounter.filamentLocated
  ) {

    locateButton.classList.remove(
      'hidden-control'
    );

    locateButton.classList.remove(
      'hidden'
    );

    locateButton.disabled =
      false;

  } else if (
    locateButton &&
    !encounter.filamentLocated
  ) {

    locateButton.classList.add(
      'hidden-control'
    );

    locateButton.classList.add(
      'hidden'
    );

    locateButton.disabled =
      true;
  }
}

/* =========================================================
   LOCATE FILAMENT
   ========================================================= */

function locateFilament() {

  if (!navigation.active) {
    return;
  }

  if (!navigation.aligned) {
    return;
  }

  if (encounter.filamentLocated) {
    commentBox.textContent =
  'FILLÁMEND LOCATED. LISTEN TO WHAT YOU FOUND. THEN LOG IT.';
    return;
  }


  encounter.filamentLocated =
    true;

/*
 * FILLÁMEND has been captured.
 *
 * Let the Reader actually hear
 * what was hidden in the signal.
 */

if (
  nodes.voiceGain &&
  ctx
) {

  nodes.voiceGain.gain.cancelScheduledValues(
    ctx.currentTime
  );

  nodes.voiceGain.gain.setTargetAtTime(
    0.18,
    ctx.currentTime,
    0.12
  );
}

  observationPhase =
    true;

  navigation.located =
    true;


  /*
   * Hide locate button.
   */

  if (locateButton) {

    locateButton.classList.add(
      'hidden'
    );

    locateButton.disabled =
      true;
  }


  /*
   * IMPORTANT:
   * Observation panel remains visible.
   */

  if (observationPanel) {

    observationPanel.classList.remove(
      'hidden'
    );
  }


  if (observationStatus) {

    observationStatus.textContent =
      'FILLÁMEND LOCATED';
  }


  if (logAttempt) {

    logAttempt.value = '';
    logAttempt.readOnly = true;
  }


  if (record) {

    record.disabled =
      false;
  }


  /*
   * Change the player's instruction.
   */

  commentBox.textContent =
    'FILLÁMEND LOCATED. RECORD WHAT YOU NOTICED.';


  if (instruction) {
    instruction.textContent =
     'LISTEN. THEN LOG WHAT YOU NOTICED';
  }


  if (statusMode) {

    statusMode.textContent =
      'OBSERVING';
  }


  console.log(
    '[READER] FILLÁMEND LOCATED'
  );


  /*
   * Tell Field Receiver that
   * the filament was found.
   */

  sendLink({

    type: 'FILLÁMEND_LOCATED',

    reader: READER_ID,

    element: READER_ELEMENT,

    encounter:
      encounter.number,

    bearing:
      navigation.targetBearing,

    heading:
      currentHeading,

    frequency:
      Number(freq.value),

    voiceFrequency:
      encounter.voiceFrequency
  });


  update();
}


/* =========================================================
   RECORD OBSERVATION
   ========================================================= */

function recordAttempt() {

  if (!observationPhase) {

    commentBox.textContent =
      'LOCATE THE FILLÁMEND BEFORE LOGGING.';

    return;
  }


  if (!encounter.filamentLocated) {

    commentBox.textContent =
      'LOCATE THE FILLÁMEND FIRST.';

    return;
  }


  if (encounter.observationLogged) {
    return;
  }


  const observation =
    (logAttempt.value || '').trim();


  if (!observation) {

    commentBox.textContent =
      'RECORD WHAT YOU NOTICED FIRST.';

    return;
  }


  encounter.observationLogged =
    true;


  const recordData = {

    id:
      `FILLÁMEND-${String(
        encounter.number
      ).padStart(2, '0')}`,

    element:
      READER_ELEMENT,

    encounter:
      encounter.number,

    observation,

    freq:
      Number(freq.value),

    band:
      Number(band.value),

    voiceFrequency:
      encounter.voiceFrequency,

    bearing:
      navigation.targetBearing,

    heading:
      currentHeading,

    timestamp:
      Date.now()
  };


  /*
   * Save locally.
   */

  const records =
    JSON.parse(
      localStorage.getItem(
        'reader_filament_records'
      ) || '[]'
    );


  records.push(
    recordData
  );


  localStorage.setItem(
    'reader_filament_records',
    JSON.stringify(records)
  );


  /*
   * Send completed field record
   * to the Field Receiver.
   */

  const logPayload = {
    type: 'FILLÁMEND_LOG',
    ...recordData,
    username: myUsername,
    transmission: encounter.activeTransmission || 'TRANSMISSION STABILIZED',
    audioRecording: currentLiveRecordingBase64 || null
  };

  sendLink(logPayload);

  // Backup to REST database
  try {
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logPayload)
    }).catch(e => console.warn('REST log backup error:', e));
  } catch(e) {}


  /*
   * Lock record.
   */

  logAttempt.readOnly =
    true;


  if (record) {

    record.disabled =
      true;
  }


  if (observationStatus) {

    observationStatus.textContent =
      'RECORDED';
  }


  commentBox.textContent =
    'OBSERVATION RECORDED.';


  if (instruction) {

    instruction.textContent =
      'FIELD RECONFIGURING';
  }


  if (statusMode) {

    statusMode.textContent =
      'RECORDED';
  }


  console.log(
    '[READER] Observation recorded:',
    recordData
  );


  /*
   * Brief pause before field changes.
   */

  setTimeout(
    () => {
      finishFilamentRecord();
    },
    1800
  );
}


/* =========================================================
   FINISH FILAMENT RECORD
   ========================================================= */

function finishFilamentRecord() {

  observationPhase =
    false;


  /*
   * Reset navigation.
   */

  navigation.active =
    false;

  navigation.targetBearing =
    null;

  navigation.difference =
    null;

  navigation.aligned =
    false;

  navigation.near =
    false;

  navigation.located =
    false;


  /*
   * Hide radar.
   */

  if (radarContainer) {

    radarContainer.classList.add(
      'hidden'
    );

    radarContainer.classList.remove(
      'visible'
    );
  }


  /*
   * Clear observation field.
   * Keep the field record section visible.
   */

  if (logAttempt) {

    logAttempt.value = '';
    logAttempt.readOnly = true;
  }


  if (record) {

    record.disabled =
      true;
  }


  /*
   * Begin next encounter.
   */

  beginNextEncounter();
}


/* =========================================================
   NEXT ENCOUNTER
   ========================================================= */

function beginNextEncounter() {
  
  mendCompleted = false;

  const previousFrequency =
    encounter.voiceFrequency;


  encounter.number++;


  createEncounter(
    previousFrequency
  );


  commentBox.textContent =
    'FIELD RECONFIGURED. NEW SIGNAL.';


  if (instruction) {

    instruction.textContent =
      'FOLLOW THE CURRENT';
  }


  if (statusMode) {

    statusMode.textContent =
      'SEARCHING';
  }


  sendLink({

    type: 'ENCOUNTER_CHANGE',

    reader:
      READER_ID,

    element:
      READER_ELEMENT,

    encounter:
      encounter.number,

    voiceFrequency:
      encounter.voiceFrequency
  });


  /*
   * Update the hidden voice filter
   * without stopping the audio engine.
   */

  if (
    running &&
    ctx &&
    nodes.voiceFilter
  ) {

    nodes.voiceFilter.frequency
      .setTargetAtTime(
        encounter.voiceFrequency,
        ctx.currentTime,
        0.15
      );
  }


  update();
}


/* =========================================================
   AUDIO DROP / TRANSMISSION EFFECT
   ========================================================= */

function scheduleDrops() {

  if (!running) {
    return;
  }


  const delay =
    randomInt(
      2500,
      5500
    );


  setTimeout(
    () => {

      if (!running) {
        return;
      }

      playTransmissionDrop();

      scheduleDrops();

    },
    delay
  );
}


/* =========================================================
   TRANSMISSION DROP
   ========================================================= */

function playTransmissionDrop() {

  if (
    !ctx ||
    !nodes.rawBus
  ) {
    return;
  }


  const currentFreq =
    Number(freq.value);


  /*
   * Choose transmission nearest
   * to the current search area.
   */

  if (
    encounter.transmissions.length
  ) {

    encounter.activeTransmission =
      encounter.transmissions
        .sort(
          (a, b) =>
            Math.abs(
              a.frequency -
              currentFreq
            ) -
            Math.abs(
              b.frequency -
              currentFreq
            )
        )[0];

        if (
  encounter.activeTransmission &&
  !encounter.mended
) {
  commentBox.textContent =
    encounter.activeTransmission.text;

if (
  encounter.activeTransmission &&
  !encounter.mended
) {

  commentBox.textContent =
    encounter.activeTransmission.text;

  if (statusMode) {
    statusMode.textContent =
      'TRANSMISSION';
  }

  setTimeout(() => {

    if (
      running &&
      !encounter.mended &&
      !encounter.signalIsolated
    ) {

      commentBox.textContent =
        'Scanning frequencies... Adjust to find resonance.';

      if (statusMode) {
        statusMode.textContent =
          'LISTENING';
      }
    }

  }, 1800);
}
}
}


  /*
   * Short noise pulse.
   */

  const source =
    createNoiseSource();


  const filter =
    ctx.createBiquadFilter();

  filter.type =
    'bandpass';

  filter.frequency.value =
    currentFreq;

  filter.Q.value =
    7;


  const gain =
    ctx.createGain();

  const now =
    ctx.currentTime;


  gain.gain.setValueAtTime(
    0,
    now
  );

  gain.gain.linearRampToValueAtTime(
    0.04,
    now + 0.03
  );

  gain.gain.linearRampToValueAtTime(
    0,
    now + 0.35
  );


  source.connect(filter);
  filter.connect(gain);
  gain.connect(nodes.rawBus);


  transientSources.add(
    source
  );


  source.start();


  setTimeout(
    () => {

      try {
        source.stop();
      } catch (error) {}

      transientSources.delete(
        source
      );

    },
    450
  );
}


/* =========================================================
   SENSOR PERMISSION
   ========================================================= */

async function requestSensorPermission() {

  if (sensorsInitialized) {
    return true;
  }


  if (
    typeof DeviceOrientationEvent !==
    'undefined' &&
    typeof DeviceOrientationEvent
      .requestPermission ===
      'function'
  ) {

    try {

      const permission =
        await DeviceOrientationEvent
          .requestPermission(true);


      if (
        permission ===
        'granted'
      ) {

        window.addEventListener(
          'deviceorientationabsolute',
          handleOrientation,
          true
        );

        window.addEventListener(
          'deviceorientation',
          handleOrientation,
          true
        );

        sensorsInitialized =
          true;

        return true;
      }


      return false;

    } catch (error) {

      console.error(
        '[READER] Sensor permission error:',
        error
      );

      return false;
    }
  }


  if (
    'DeviceOrientationEvent'
    in window
  ) {

    window.addEventListener(
      'deviceorientationabsolute',
      handleOrientation,
      true
    );

    window.addEventListener(
      'deviceorientation',
      handleOrientation,
      true
    );

    sensorsInitialized =
      true;

    return true;
  }


  return false;
}


/* =========================================================
   ORIENTATION HANDLER
   ========================================================= */

function handleOrientation(event) {

  let heading = null;


  /*
   * iOS
   */

  if (
    typeof event.webkitCompassHeading ===
    'number'
  ) {

    heading =
      event.webkitCompassHeading;
  }


  /*
   * Android / absolute orientation
   */

  else if (
    typeof event.alpha ===
    'number'
  ) {

    heading =
      360 -
      event.alpha;
  }


  if (
    heading === null ||
    Number.isNaN(heading)
  ) {
    return;
  }


  currentHeading =
    normalizeHeading(
      heading
    );


  if (headingDisplay) {

    headingDisplay.textContent =
      `BEARING: ${
        String(
          Math.round(
            navigation.targetBearing ??
            currentHeading
          )
        ).padStart(3, '0')
      }°`;
  }


  if (navigation.active) {

    updateNavigation();
  }
}


/* =========================================================
   UPDATE UI
   ========================================================= */

function update() {

  if (freqValue) {

    freqValue.textContent =
      Number(freq.value);
  }


  if (meter) {

    const current =
      Number(freq.value);

    const min =
      Number(freq.min);

    const max =
      Number(freq.max);

    const percentage =
      (
        (current - min) /
        (max - min)
      ) * 100;

    meter.style.width =
      `${percentage}%`;
  }


  if (running) {

    checkHiddenVoiceMatch();
  }


  if (navigation.active) {

    updateNavigation();
  }


  updateInstruction();
}


/* =========================================================
   KEYPAD
   ========================================================= */

function handleKeypadInput(key) {

  if (!logAttempt) {
    return;
  }


  if (
    !observationPhase ||
    !encounter.filamentLocated
  ) {
    return;
  }


  if (key === 'SPACE') {

    logAttempt.value +=
      ' ';

    return;
  }


  if (key === 'BACK') {

    logAttempt.value =
      logAttempt.value.slice(
        0,
        -1
      );

    return;
  }


  /*
   * Only allow normal
   * single-character keys.
   */

  if (
    typeof key === 'string' &&
    key.length === 1
  ) {

    logAttempt.value +=
      key;
  }
}


/* =========================================================
   WEBSOCKET CONNECTION
   ========================================================= */

function connectLink() {
  if (link) {
    try {
      link.close();
    } catch (error) {}

    link = null;
  }

  const protocol =
    location.protocol === 'https:'
      ? 'wss:'
      : 'ws:';

  // Server WebSocket endpoint is /ws
  const wsUrl =
    `${protocol}//${location.host}/ws`;

  console.log('[READER] Connecting:', wsUrl);

  try {
    link = new WebSocket(wsUrl);
  } catch (error) {
    console.error(
      '[READER] WebSocket error:',
      error
    );

    scheduleReconnect();
    return;
  }

  link.addEventListener('open', () => {
    console.log('[READER] LINKED');

    sendLink({
      type: 'HELLO',
      role: 'reader',
      reader: READER_ID,
      element: READER_ELEMENT
    });

    sendLink({
      type: 'STATE',
      reader: READER_ID,
      element: READER_ELEMENT,
      encounter: encounter.number,
      frequency: Number(freq.value),
      band: Number(band.value),
      running,
      voiceFrequency: encounter.voiceFrequency
    });
  });

  link.addEventListener('message', handleLinkMessage);

  link.addEventListener('close', () => {
    console.log('[READER] LINK LOST');

    scheduleReconnect();
  });

  link.addEventListener('error', error => {
    console.error(
      '[READER] WebSocket error:',
      error
    );
  });
}


/* =========================================================
   RECONNECT
   ========================================================= */

function scheduleReconnect() {

  if (reconnectTimer) {
    return;
  }


  reconnectTimer =
    setTimeout(
      () => {

        reconnectTimer =
          null;

        connectLink();

      },
      2000
    );
}


/* =========================================================
   SEND WEBSOCKET MESSAGE
   ========================================================= */

function sendLink(message) {

  if (
    !link ||
    link.readyState !==
    WebSocket.OPEN
  ) {
    return;
  }


  try {

    link.send(
      JSON.stringify(
        message
      )
    );

  } catch (error) {

    console.error(
      '[READER] Send error:',
      error
    );
  }
}


/* =========================================================
   INCOMING WEBSOCKET MESSAGE
   ========================================================= */

function handleLinkMessage(event) {

  let message;

  try {

    message =
      JSON.parse(
        event.data
      );

  } catch (error) {

    return;
  }


  /*
   * Reader is intentionally not controlled
   * by the laptop.
   *
   * The Field Receiver receives state/logs;
   * it does not generate commands.
   */

  console.log(
    '[READER] Incoming:',
    message
  );

  if (message.username) {
    myUsername = message.username;
    const userEl = document.querySelector('#user-codename');
    if (userEl) userEl.textContent = myUsername;
  }

  if (message.type === 'SELECT_ELEMENT' && message.element && message.element !== READER_ELEMENT) {
    setReaderElement(message.element, true);
  }
}


/* =========================================================
   INPUT EVENTS
   ========================================================= */

freq?.addEventListener(
  'input',
  () => {

    update();

    sendLink({

      type: 'CONTROL',

      reader:
        READER_ID,

      element:
        READER_ELEMENT,

      frequency:
        Number(freq.value),

      band:
        Number(band.value)
    });
  }
);


band?.addEventListener(
  'input',
  () => {

    update();

    sendLink({

      type: 'CONTROL',

      reader:
        READER_ID,

      element:
        READER_ELEMENT,

      frequency:
        Number(freq.value),

      band:
        Number(band.value)
    });
  }
);


/* =========================================================
   LISTEN BUTTON
   ========================================================= */

listenButton?.addEventListener(
  'click',
  async () => {

    if (running) {

      stopListening();

    } else {

      await startListening();
    }
  }
);


/* =========================================================
   MEND BUTTON
   ========================================================= */

mendButton?.addEventListener('click',mendSignal);


/* =========================================================
   LOCATE FILAMENT BUTTON
   ========================================================= */

locateButton?.addEventListener('click',locateFilament);


/* =========================================================
   RECORD BUTTON
   ========================================================= */

recordButton?.addEventListener('click',recordAttempt);


/* =========================================================
   KEYPAD
   ========================================================= */

keypad?.addEventListener(
  'click',
  event => {

    const button =
      event.target.closest(
        'button[data-key]'
      );

    if (!button) {
      return;
    }


    handleKeypadInput(
      button.dataset.key
    );
  }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

createEncounter();

connectLink();

update();


console.log(
  '[READER] Initialized.'
);

console.log(
  '[READER] First hidden frequency:',
  encounter.voiceFrequency,
  'Hz'
);

/* =========================================================
   ELEMENT SELECTION (WATER & SAND)
   ========================================================= */

function setReaderElement(newElement, fromRemote = false) {
  if (newElement !== 'WATER' && newElement !== 'SAND') return;
  READER_ELEMENT = newElement;

  document.body.className = newElement === 'SAND' ? 'element-sand' : 'element-water';

  const waterBtn = document.querySelector('#element-water-btn');
  const sandBtn = document.querySelector('#element-sand-btn');
  if (waterBtn && sandBtn) {
    waterBtn.classList.toggle('active', newElement === 'WATER');
    sandBtn.classList.toggle('active', newElement === 'SAND');
  }

  const dacTitle = document.querySelector('#dac-display-title');
  const dacTag = document.querySelector('#dac-tag-badge');
  const elemTag = document.querySelector('#element-tag-display');
  const flowLabel = document.querySelector('#flow-label');
  const depthLabel = document.querySelector('#band-slider-label');
  const freqLabel = document.querySelector('#freq-slider-label');

  if (dacTitle) dacTitle.textContent = `DAC-04 / ${newElement}`;
  if (dacTag) dacTag.textContent = `DAC-04 ${newElement}`;
  if (elemTag) elemTag.textContent = newElement;

  if (newElement === 'SAND') {
    if (instruction) instruction.textContent = 'FOLLOW THE RESIDUE';
    if (flowLabel) flowLabel.textContent = 'DRIFT';
    if (freqLabel) freqLabel.textContent = 'DRIFT';
    if (depthLabel) depthLabel.textContent = 'STRATA';
    freq.value = 520;
    band.value = 160;
  } else {
    if (instruction) instruction.textContent = 'FOLLOW THE CURRENT';
    if (flowLabel) flowLabel.textContent = 'FLOW';
    if (freqLabel) freqLabel.textContent = 'FLOW';
    if (depthLabel) depthLabel.textContent = 'DEPTH';
    freq.value = 440;
    band.value = 120;
  }

  update();

  encounter.transmissions = createTransmissions();
  encounter.voiceFrequency = newElement === 'SAND' ? 520 : 440;

  if (!fromRemote) {
    sendLink({
      type: 'SELECT_ELEMENT',
      element: newElement,
      freq: Number(freq.value),
      band: Number(band.value)
    });
  }

  if (running) {
    stopListening();
    startListening();
  }
}

document.querySelector('#element-water-btn')?.addEventListener('click', () => setReaderElement('WATER'));
document.querySelector('#element-sand-btn')?.addEventListener('click', () => setReaderElement('SAND'));

/* =========================================================
   LIVE ACOUSTIC RECORDER TRANSDUCER
   ========================================================= */

const startRecBtn = document.querySelector('#start-rec-btn');
const stopRecBtn = document.querySelector('#stop-rec-btn');
const playRecBtn = document.querySelector('#play-rec-btn');
const recStatusTag = document.querySelector('#rec-status-tag');
const recMeterLevel = document.querySelector('#rec-meter-level');
const recMemoText = document.querySelector('#rec-memo-text');

let recAudioBlob = null;
let recAudioUrl = null;

async function startLiveRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      recAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      recAudioUrl = URL.createObjectURL(recAudioBlob);

      const reader = new FileReader();
      reader.onloadend = () => {
        currentLiveRecordingBase64 = reader.result;
        if (recMemoText) recMemoText.textContent = `Acoustic sample captured (${Math.round(recAudioBlob.size / 1024)} KB). Attached to observation.`;
      };
      reader.readAsDataURL(recAudioBlob);

      stream.getTracks().forEach(t => t.stop());

      if (startRecBtn) startRecBtn.style.display = 'block';
      if (stopRecBtn) stopRecBtn.style.display = 'none';
      if (playRecBtn) playRecBtn.style.display = 'block';
      if (recStatusTag) {
        recStatusTag.textContent = 'SAMPLE CAPTURED';
        recStatusTag.className = 'rec-idle';
      }
      if (recMeterLevel) recMeterLevel.style.width = '0%';
    };

    mediaRecorder.start();

    if (startRecBtn) startRecBtn.style.display = 'none';
    if (stopRecBtn) stopRecBtn.style.display = 'block';
    if (recStatusTag) {
      recStatusTag.textContent = 'RECORDING LIVE...';
      recStatusTag.className = 'rec-live';
    }

    let meterInterval = setInterval(() => {
      if (!mediaRecorder || mediaRecorder.state !== 'recording') {
        clearInterval(meterInterval);
        return;
      }
      if (recMeterLevel) {
        const rand = 30 + Math.random() * 65;
        recMeterLevel.style.width = `${rand}%`;
      }
    }, 150);

  } catch (err) {
    console.warn('Microphone access unavailable or denied:', err);
    if (recMemoText) recMemoText.textContent = 'Synthesized transducer sample captured.';
    if (recStatusTag) recStatusTag.textContent = 'SYNTHESIZED';
    currentLiveRecordingBase64 = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    if (playRecBtn) playRecBtn.style.display = 'block';
  }
}

function stopLiveRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}

function playLiveRecording() {
  if (recAudioUrl) {
    const snd = new Audio(recAudioUrl);
    snd.play();
  }
}

startRecBtn?.addEventListener('click', startLiveRecording);
stopRecBtn?.addEventListener('click', stopLiveRecording);
playRecBtn?.addEventListener('click', playLiveRecording);

// Initialize element from URL parameter if present
const urlParams = new URLSearchParams(window.location.search);
const elemParam = urlParams.get('element');
if (elemParam && (elemParam.toUpperCase() === 'SAND' || elemParam.toUpperCase() === 'WATER')) {
  setReaderElement(elemParam.toUpperCase(), true);
}