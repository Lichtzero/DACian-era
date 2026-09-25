import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// If server.js is inside "network"
// and laptop/phone are siblings:
const networkDir = path.resolve(__dirname, '..');

const PORT =
  Number(process.env.PORT || 8787);


const NGROK_URL =
  'https://debatable-casino-lent.ngrok-free.dev';


const clients = new Set();


let state = {
  element: 'WATER',
  freq: 440,
  band: 120,
  listening: false,
  observation: '',
  lastGemma: ''
};


const laptopText = {

  WATER: {
    title: 'FIELD 01 / WATER',

    instruction:
      'FOLLOW THE CURRENT',

    explanation:
      'Adjust the Reader until the submerged signal settles. Do not assume the first sound is the message.',

    scene:
      'A shallow body of water covers the remains of a settlement. Something beneath the surface is still carrying a signal.'
  },


  SAND: {
    title: 'FIELD 02 / SAND',

    instruction:
      'FOLLOW THE RESIDUE',

    explanation:
      'Sweep the Reader through the residue. Attend to what becomes distinct rather than what becomes loud.',

    scene:
      'Wind has exposed part of an old structure. Fine material keeps shifting around something that should not be there.'
  }

};


// --------------------------------------------------
// WEBSOCKET HELPERS
// --------------------------------------------------

function broadcast(obj) {

  const msg =
    JSON.stringify(obj);

  for (const ws of clients) {

    if (ws.readyState === 1) {

      try {
        ws.send(msg);
      }

      catch (err) {
        console.error(
          'WebSocket send error:',
          err
        );
      }
    }
  }
}


function sendInitial(ws) {

  ws.send(
    JSON.stringify({
      type: 'STATE',

      state,

      text:
        laptopText[state.element]
    })
  );
}


// --------------------------------------------------
// HTTP SERVER
// --------------------------------------------------

const server =
  http.createServer((req, res) => {

    try {

      const requestUrl =
        new URL(
          req.url,
          `http://${req.headers.host || 'localhost'}`
        );


      let filePath;


      if (requestUrl.pathname === '/') {

        filePath =
          path.join(
            networkDir,
            'laptop',
            'index.html'
          );

      }

      else {

        const requestedPath =
          decodeURIComponent(
            requestUrl.pathname.replace(
              /^\/+/,
              ''
            )
          );

        filePath =
          path.join(
            networkDir,
            requestedPath
          );
      }


      const resolvedBase =
        path.resolve(networkDir);

      const resolvedFile =
        path.resolve(filePath);


      if (
        resolvedFile !== resolvedBase &&
        !resolvedFile.startsWith(
          resolvedBase + path.sep
        )
      ) {

        res.writeHead(403);

        return res.end('Forbidden');
      }


      fs.readFile(
        resolvedFile,
        (err, data) => {

          if (err) {

            console.error(
              'File not found:',
              resolvedFile
            );

            res.writeHead(
              404,
              {
                'Content-Type':
                  'text/plain'
              }
            );

            return res.end(
              'Not found'
            );
          }


          const ext =
            path.extname(
              resolvedFile
            ).toLowerCase();


          const contentTypes = {

            '.html':
              'text/html; charset=utf-8',

            '.css':
              'text/css; charset=utf-8',

            '.js':
              'text/javascript; charset=utf-8',

            '.json':
              'application/json; charset=utf-8',

            '.wav':
              'audio/wav',

            '.mp3':
              'audio/mpeg',

            '.ogg':
              'audio/ogg',

            '.png':
              'image/png',

            '.jpg':
              'image/jpeg',

            '.jpeg':
              'image/jpeg',

            '.svg':
              'image/svg+xml',

            '.ico':
              'image/x-icon'
          };


          res.writeHead(
            200,
            {
              'Content-Type':
                contentTypes[ext] ||
                'application/octet-stream',

              'Cache-Control':
                'no-cache'
            }
          );


          res.end(data);
        }
      );

    }

    catch (err) {

      console.error(
        'HTTP error:',
        err
      );

      res.writeHead(
        500,
        {
          'Content-Type':
            'text/plain'
        }
      );

      res.end(
        'Internal server error'
      );
    }
  });


// --------------------------------------------------
// WEBSOCKET SERVER
// --------------------------------------------------

const wss =
  new WebSocketServer({
    server,
    path: '/ws'
  });


wss.on(
  'connection',
  (ws, request) => {

    console.log('');
    console.log(
      '----------------------------------------'
    );
    console.log(
      'WEBSOCKET CONNECTED'
    );
    console.log(
      '----------------------------------------'
    );

    console.log(
      'IP:',
      request.socket.remoteAddress
    );

    console.log(
      'URL:',
      request.url
    );


    clients.add(ws);


    ws.role = null;
    ws.reader = null;
    ws.element = state.element;


    // Send current state immediately
    sendInitial(ws);


    // Tell everyone a client connected
    broadcast({
      type: 'CONNECTION',
      role: ws.role,
      element: ws.element,
      connected: true
    });


    ws.on(
      'message',
      raw => {

        let msg;


        try {

          msg =
            JSON.parse(
              raw.toString()
            );
        }

        catch (err) {

          console.error(
            'Invalid WebSocket message:',
            raw.toString()
          );

          return;
        }


        console.log(
          'WS MESSAGE:',
          msg
        );


        // ------------------------------------------
        // HELLO
        // ------------------------------------------

        if (msg.type === 'HELLO') {

          ws.role =
            msg.role || null;

          ws.reader =
            msg.reader || null;

          ws.element =
            msg.element ||
            state.element;


          console.log(
            `Client identified as ${
              ws.role || 'unknown'
            }`
          );


          broadcast({
            type: 'CONNECTION',
            role: ws.role,
            reader: ws.reader,
            element: ws.element,
            connected: true
          });


          sendInitial(ws);


          return;
        }


        // ------------------------------------------
        // STATE
        // ------------------------------------------

        if (msg.type === 'STATE') {

          if (msg.element) {

            state.element =
              msg.element === 'SAND'
                ? 'SAND'
                : 'WATER';
          }


          if (
            msg.frequency !== undefined
          ) {

            state.freq =
              Number(msg.frequency);
          }


          if (
            msg.band !== undefined
          ) {

            state.band =
              Number(msg.band);
          }


          if (
            msg.running !== undefined
          ) {

            state.listening =
              Boolean(msg.running);
          }


          broadcast({
            type: 'STATE',

            reader:
              msg.reader,

            element:
              state.element,

            encounter:
              msg.encounter,

            frequency:
              state.freq,

            band:
              state.band,

            running:
              state.listening,

            voiceFrequency:
              msg.voiceFrequency,

            state,

            text:
              laptopText[state.element]
          });


          return;
        }


        // ------------------------------------------
        // SELECT ELEMENT
        // ------------------------------------------

        if (
          msg.type ===
          'SELECT_ELEMENT'
        ) {

          state.element =
            msg.element === 'SAND'
              ? 'SAND'
              : 'WATER';


          if (
            msg.freq !== undefined
          ) {

            state.freq =
              Number(msg.freq);
          }


          if (
            msg.band !== undefined
          ) {

            state.band =
              Number(msg.band);
          }


          broadcast({
            type: 'STATE',

            state,

            text:
              laptopText[
                state.element
              ]
          });


          return;
        }


        // ------------------------------------------
        // CONTROL
        // ------------------------------------------

        if (
          msg.type ===
          'CONTROL'
        ) {

          if (
            msg.freq !== undefined
          ) {

            state.freq =
              Number(msg.freq);
          }


          if (
            msg.band !== undefined
          ) {

            state.band =
              Number(msg.band);
          }


          if (msg.element) {

            state.element =
              msg.element === 'SAND'
                ? 'SAND'
                : 'WATER';
          }


          broadcast({
            type: 'CONTROL',

            state
          });


          return;
        }


        // ------------------------------------------
        // LISTEN
        // ------------------------------------------

        if (
          msg.type ===
          'LISTEN'
        ) {

          state.listening =
            true;


          console.log(
            'LISTENING'
          );


          broadcast({
            type: 'LISTEN',

            state,

            element:
              msg.element,

            frequency:
              msg.frequency,

            band:
              msg.band
          });


          return;
        }


        // ------------------------------------------
        // STOP
        // ------------------------------------------

        if (
          msg.type ===
          'STOP'
        ) {

          state.listening =
            false;


          console.log(
            'STOPPED'
          );


          broadcast({
            type: 'STOP',

            state
          });


          return;
        }


        // ------------------------------------------
        // MEND
        // ------------------------------------------

        if (
          msg.type ===
          'MEND'
        ) {

          console.log(
            'MEND:',
            msg
          );


          broadcast({
            type: 'MEND',

            ...msg
          });


          return;
        }


        // ------------------------------------------
        // FILLÁMEND LOCATED
        // ------------------------------------------

        if (
          msg.type ===
          'FILLÁMEND_LOCATED'
        ) {

          console.log(
            'FILLÁMEND LOCATED:',
            msg
          );


          broadcast({
            type:
              'FILLÁMEND_LOCATED',

            ...msg
          });


          return;
        }


        // ------------------------------------------
        // ENCOUNTER CHANGE
        // ------------------------------------------

        if (
          msg.type ===
          'ENCOUNTER_CHANGE'
        ) {

          console.log(
            'ENCOUNTER CHANGE:',
            msg
          );


          broadcast({
            type:
              'ENCOUNTER_CHANGE',

            ...msg
          });


          return;
        }


        // ------------------------------------------
        // LOG / OBSERVATION
        // ------------------------------------------

        if (
          msg.type === 'LOG' ||
          msg.type ===
            'FILLÁMEND_LOG'
        ) {

          // Reader sends "observation",
          // not "text".
          state.observation =
            String(
              msg.observation ??
              msg.text ??
              ''
            );


          if (
            msg.freq !== undefined
          ) {

            state.freq =
              Number(msg.freq);
          }


          if (
            msg.band !== undefined
          ) {

            state.band =
              Number(msg.band);
          }


          if (msg.element) {

            state.element =
              msg.element === 'SAND'
                ? 'SAND'
                : 'WATER';
          }


          console.log(
            'OBSERVATION:',
            state.observation
          );


          broadcast({

            type:
              'FILLÁMEND_LOG',

            id:
              msg.id,

            observation:
              state.observation,

            freq:
              state.freq,

            band:
              state.band,

            element:
              state.element,

            encounter:
              msg.encounter,

            voiceFrequency:
              msg.voiceFrequency,

            bearing:
              msg.bearing,

            heading:
              msg.heading,

            timestamp:
              msg.timestamp
          });


          // Gemma hooks remain,
          // but Gemma does not control
          // the Reader interaction.

          broadcast({
            type:
              'GEMMA_STATUS',

            status:
              'THINKING'
          });


          broadcast({
            type:
              'GEMMA_REQUEST',

            request: {

              observation:
                state.observation,

              freq:
                state.freq,

              band:
                state.band,

              element:
                state.element
            }
          });


          return;
        }


        // ------------------------------------------
        // GEMMA RESPONSE
        // ------------------------------------------

        if (
          msg.type ===
          'GEMMA_RESPONSE'
        ) {

          state.lastGemma =
            String(
              msg.text || ''
            );


          console.log(
            'GEMMA RESPONSE:',
            state.lastGemma
          );


          broadcast({
            type:
              'GEMMA_RESPONSE',

            text:
              state.lastGemma
          });


          broadcast({
            type:
              'GEMMA_STATUS',

            status:
              'READY'
          });


          return;
        }


        // ------------------------------------------
        // UNKNOWN MESSAGE
        // ------------------------------------------

        console.log(
          'Unknown message type:',
          msg.type
        );
      }
    );


    // --------------------------------------------
    // CLOSE
    // --------------------------------------------

    ws.on(
      'close',
      () => {

        clients.delete(ws);


        console.log(
          `WebSocket disconnected (${
            ws.role || 'unknown'
          })`
        );


        broadcast({
          type:
            'CONNECTION',

          role:
            ws.role,

          reader:
            ws.reader,

          element:
            ws.element,

          connected:
            false
        });
      }
    );


    ws.on(
      'error',
      err => {

        console.error(
          'WebSocket error:',
          err.message
        );
      }
    );
  }
);


// --------------------------------------------------
// SERVER START
// --------------------------------------------------

server.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log('');

    console.log(
      '========================================'
    );

    console.log(
      '        READER SERVER RUNNING'
    );

    console.log(
      '========================================'
    );

    console.log('');

    console.log(
      `Port: ${PORT}`
    );

    console.log(
      `Local: http://localhost:${PORT}`
    );

    console.log('');

    console.log(
      'WebSocket:'
    );

    console.log(
      `  ws://localhost:${PORT}/ws`
    );

    console.log('');

    console.log(
      'IMPORTANT:'
    );

    console.log(
      'The browser clients should connect to:'
    );

    console.log(
      '  /ws'
    );

    console.log('');

    console.log(
      'For ngrok HTTPS, the browser should'
    );

    console.log(
      'automatically use WSS.'
    );

    console.log('');

    console.log(
      '========================================'
    );

    console.log('');
  }
);


// --------------------------------------------------
// CLEAN SHUTDOWN
// --------------------------------------------------

process.on(
  'SIGINT',
  () => {

    console.log('');

    console.log(
      'Shutting down Reader server...'
    );


    for (const ws of clients) {

      try {
        ws.close();
      }

      catch {}
    }


    wss.close(
      () => {

        server.close(
          () => {
            process.exit(0);
          }
        );
      }
    );
  }
);