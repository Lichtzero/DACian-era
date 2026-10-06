const connection =
  document.querySelector('#connection');

const fieldTitle =
  document.querySelector('#fieldTitle');

const stateEl =
  document.querySelector('#state');

const instruction =
  document.querySelector('#instruction');

const sceneText =
  document.querySelector('#sceneText');

const freqEl =
  document.querySelector('#freq');

const bandEl =
  document.querySelector('#band');

const readerEl =
  document.querySelector('#reader');

const observation =
  document.querySelector('#observation');

const gemma =
  document.querySelector('#gemma');

const optionHelp =
  document.querySelector('#optionHelp');

const optionText =
  document.querySelector('#optionText');

const canvas =
  document.querySelector('#cymatic');


const ctx =
  canvas.getContext('2d');


let S = {

  element: 'WATER',

  freq: 440,

  band: 120,

  listening: false,

  observation: '',

  encounter: 1,

  voiceFrequency: null
};


let connected = false;

let phase = 0;

let ws = null;

let reconnectTimer = null;


// --------------------------------------------------
// WEBSOCKET CONNECTION
// --------------------------------------------------

function connectReader() {

  const protocol =
    window.location.protocol === 'https:'
      ? 'wss:'
      : 'ws:';


  const host =
    window.location.host;


  const wsUrl =
    `${protocol}//${host}/ws`;


  console.log(
    'Connecting to Reader:',
    wsUrl
  );


  try {

    ws =
      new WebSocket(wsUrl);

  }

  catch (err) {

    console.error(
      'Could not create WebSocket:',
      err
    );

    scheduleReconnect();

    return;
  }


  // ----------------------------------------------
  // OPEN
  // ----------------------------------------------

  ws.addEventListener(
    'open',
    () => {

      connected = true;


      console.log(
        'Reader WebSocket connected:',
        wsUrl
      );


      connection.textContent =
        'LINKED';


      ws.send(
        JSON.stringify({

          type: 'HELLO',

          role: 'laptop',

          element:
            S.element
        })
      );
    }
  );


  // ----------------------------------------------
  // CLOSE
  // ----------------------------------------------

  ws.addEventListener(
    'close',
    () => {

      connected = false;


      console.log(
        'Reader WebSocket disconnected'
      );


      connection.textContent =
        'NO READER';


      scheduleReconnect();
    }
  );


  // ----------------------------------------------
  // ERROR
  // ----------------------------------------------

  ws.addEventListener(
    'error',
    err => {

      console.error(
        'Reader WebSocket error:',
        err
      );
    }
  );


  // ----------------------------------------------
  // MESSAGE
  // ----------------------------------------------

  ws.addEventListener(
    'message',
    e => {

      let m;


      try {

        m =
          JSON.parse(e.data);

      }

      catch (err) {

        console.warn(
          'Invalid WebSocket message:',
          e.data
        );

        return;
      }


      console.log(
        '[FIELD RECEIVER] Reader message:',
        m
      );


      // ------------------------------------------
      // CONNECTION
      // ------------------------------------------

      if (
        m.type ===
        'CONNECTION'
      ) {

        if (
          m.role === 'reader'
        ) {

          if (
            m.connected === false
          ) {

            connection.textContent =
              'NO READER';

          }

          else {

            connection.textContent =
              'READER LINKED';
          }
        }


        return;
      }


      // ------------------------------------------
      // STATE
      // ------------------------------------------

      if (
        m.type ===
        'STATE'
      ) {

        S = {

          ...S,

          ...(m.state || {}),

          ...(m.frequency !== undefined
            ? {
                freq:
                  m.frequency
              }
            : {}),

          ...(m.band !== undefined
            ? {
                band:
                  m.band
              }
            : {}),

          ...(m.running !== undefined
            ? {
                listening:
                  m.running
              }
            : {}),

          ...(m.element !== undefined
            ? {
                element:
                  m.element
              }
            : {}),

          ...(m.encounter !== undefined
            ? {
                encounter:
                  m.encounter
              }
            : {}),

          ...(m.voiceFrequency !== undefined
            ? {
                voiceFrequency:
                  m.voiceFrequency
              }
            : {})
        };


        render(m.text);


        return;
      }


      // ------------------------------------------
      // CONTROL
      // ------------------------------------------

      if (
        m.type ===
        'CONTROL'
      ) {

        S = {

          ...S,

          ...(m.state || {}),

          ...(m.frequency !== undefined
            ? {
                freq:
                  m.frequency
              }
            : {}),

          ...(m.band !== undefined
            ? {
                band:
                  m.band
              }
            : {})
        };


        render();


        return;
      }


      // ------------------------------------------
      // LISTEN
      // ------------------------------------------

      if (
        m.type ===
        'LISTEN'
      ) {

        S = {

          ...S,

          listening: true,

          ...(m.element !== undefined
            ? {
                element:
                  m.element
              }
            : {}),

          ...(m.frequency !== undefined
            ? {
                freq:
                  m.frequency
              }
            : {}),

          ...(m.band !== undefined
            ? {
                band:
                  m.band
              }
            : {})
        };


        stateEl.textContent =
          'LISTENING';


        render();


        console.log(
          '[FIELD RECEIVER] READER LISTENING'
        );


        return;
      }


      // ------------------------------------------
      // STOP
      // ------------------------------------------

      if (
        m.type ===
        'STOP'
      ) {

        S = {

          ...S,

          listening:
            false
        };


        stateEl.textContent =
          'STANDBY';


        render();


        console.log(
          '[FIELD RECEIVER] READER STOPPED'
        );


        return;
      }


      // ------------------------------------------
      // MEND
      // ------------------------------------------

      if (
        m.type ===
        'MEND'
      ) {

        console.log(
          '[FIELD RECEIVER] MEND:',
          m
        );


        return;
      }


      // ------------------------------------------
      // FILLÁMEND LOCATED
      // ------------------------------------------

      if (
        m.type ===
        'FILLÁMEND_LOCATED'
      ) {

        console.log(
          '[FIELD RECEIVER] FILLÁMEND LOCATED:',
          m
        );


        return;
      }


      // ------------------------------------------
      // ENCOUNTER CHANGE
      // ------------------------------------------

      if (
        m.type ===
        'ENCOUNTER_CHANGE'
      ) {

        S = {

          ...S,

          encounter:
            m.encounter ??
            S.encounter,

          freq:
            m.frequency ??
            m.freq ??
            S.freq,

          band:
            m.band ??
            S.band,

          voiceFrequency:
            m.voiceFrequency ??
            S.voiceFrequency
        };


        render();


        console.log(
          '[FIELD RECEIVER] NEW ENCOUNTER:',
          m
        );


        return;
      }


      // ------------------------------------------
      // FILLÁMEND LOG
      // ------------------------------------------

      if (
        m.type ===
          'FILLÁMEND_LOG' ||
        m.type ===
          'LOG'
      ) {

        console.log(
          '[FIELD RECEIVER] FILLÁMEND LOG:',
          m
        );


        if (observation) {

          observation.textContent =
            `${m.observation || ''}` +
            `  [${m.element || S.element}` +
            ` / ${m.freq || 0} Hz` +
            ` / band ${m.band || 0}]`;
        }


        S = {

          ...S,

          element:
            m.element ||
            S.element,

          freq:
            m.freq ??
            S.freq,

          band:
            m.band ??
            S.band,

          encounter:
            m.encounter ??
            S.encounter,

          voiceFrequency:
            m.voiceFrequency ??
            S.voiceFrequency,

          observation:
            m.observation ||
            S.observation
        };


        render();


        return;
      }


      // ------------------------------------------
      // GEMMA
      // ------------------------------------------

      if (
        m.type ===
        'GEMMA_RESPONSE'
      ) {

        if (gemma) {

          gemma.textContent =
            m.text || '';
        }


        return;
      }


      if (
        m.type ===
        'GEMMA_STATUS'
      ) {

        console.log(
          '[FIELD RECEIVER] GEMMA:',
          m.status
        );


        return;
      }


      console.log(
        '[FIELD RECEIVER] Unhandled message:',
        m.type
      );
    }
  );
}


// --------------------------------------------------
// RECONNECT
// --------------------------------------------------

function scheduleReconnect() {

  if (reconnectTimer) {
    return;
  }


  reconnectTimer =
    setTimeout(
      () => {

        reconnectTimer =
          null;


        if (!connected) {

          connectReader();
        }

      },

      2000
    );
}


// --------------------------------------------------
// INITIAL CONNECTION
// --------------------------------------------------

connectReader();


// --------------------------------------------------
// RENDER
// --------------------------------------------------

function render(text) {

  const t =
    text || {};


  fieldTitle.textContent =
    t.title ||
    `FIELD / ${S.element}`;


  instruction.textContent =
    t.instruction || '';


  sceneText.textContent =
    t.scene || '';


  optionText.textContent =
    t.explanation || '';


  freqEl.textContent =
    S.freq;


  bandEl.textContent =
    S.band;


  readerEl.textContent =
    S.element;


  stateEl.textContent =
    S.listening
      ? 'LISTENING'
      : 'STANDBY';
}


// --------------------------------------------------
// OPTION HELP
// --------------------------------------------------

window.addEventListener(
  'keydown',
  e => {

    if (
      e.altKey &&
      !e.metaKey &&
      !e.ctrlKey
    ) {

      optionHelp.style.display =
        'block';

      e.preventDefault();
    }
  }
);


window.addEventListener(
  'keyup',
  e => {

    if (!e.altKey) {

      optionHelp.style.display =
        'none';
    }
  }
);


window.addEventListener(
  'blur',
  () => {

    optionHelp.style.display =
      'none';
  }
);


// --------------------------------------------------
// CYMATIC DISPLAY
// --------------------------------------------------

function draw() {

  const w =
    canvas.width;

  const h =
    canvas.height;


  ctx.fillStyle =
    '#0e1310';

  ctx.fillRect(
    0,
    0,
    w,
    h
  );


  const cx =
    w / 2;

  const cy =
    h / 2;


  const f =
    Number(S.freq) ||
    440;


  const b =
    Number(S.band) ||
    120;


  const el =
    S.element;


  const base =
    el === 'WATER'
      ? 1.0
      : 0.76;


  // PARTICLES

  for (
    let i = 0;
    i < 180;
    i++
  ) {

    const a =
      i / 180 *
      Math.PI * 2;


    const r =
      55 +
      i * 2.0 +
      Math.sin(
        i * .21 +
        phase
      ) *
      b * .10;


    const wob =
      Math.sin(
        a *
        (el === 'WATER'
          ? 5
          : 7) +
        phase *
        base
      ) *
      b * .18;


    const x =
      cx +
      Math.cos(a) *
      (r + wob);


    const y =
      cy +
      Math.sin(a) *
      (r - wob * .45);


    const alpha =
      .12 +
      .22 *
      (i / 180);


    ctx.fillStyle =
      `rgba(150,190,160,${alpha})`;


    ctx.fillRect(
      x,
      y,
      2,
      2
    );
  }


  // RINGS

  for (
    let k = 0;
    k < 8;
    k++
  ) {

    ctx.beginPath();


    for (
      let i = 0;
      i <= 180;
      i++
    ) {

      const a =
        i / 180 *
        Math.PI * 2;


      const rr =
        70 +
        k * 34 +
        Math.sin(
          a *
          (el === 'WATER'
            ? 3
            : 9) +
          phase *
          (1 + k * .03)
        ) *
        b * .12;


      const x =
        cx +
        Math.cos(a) *
        rr;


      const y =
        cy +
        Math.sin(a) *
        rr *
        .58;


      if (i === 0) {

        ctx.moveTo(
          x,
          y
        );

      }

      else {

        ctx.lineTo(
          x,
          y
        );
      }
    }


    ctx.strokeStyle =
      `rgba(175,210,180,${.07 + k * .012})`;


    ctx.stroke();
  }


  // ANIMATION

  phase +=
    .008 +
    (f / 1200) *
    .006;


  requestAnimationFrame(
    draw
  );
}


draw();


// --------------------------------------------------
// INITIAL UI
// --------------------------------------------------

render();