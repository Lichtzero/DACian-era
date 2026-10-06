# Reader Network Prototype — WATER

This keeps the **v8 phone Reader UI** intact and adds a laptop/world receiver plus a local Wi-Fi link.

## What is connected
- Laptop: `laptop/index.html` — world/scenario, cymatic-style visual field, telemetry, observation, Gemma response, Option-key context.
- Phone: `phone/index.html` — the existing WATER Reader.
- Network: `network/server.js` — local WebSocket relay.

## Run
1. Install Node.js.
2. In `network/`, run `npm install`.
3. Run `npm start`.
4. On the Mac open `http://localhost:8787/laptop/`.
5. On the Android phone, open `http://MAC-LAN-IP:8787/phone/` (use the Mac's local Wi-Fi IP).

### If the phone is opened as a file
Set the phone Reader link host in browser console/localStorage: `localStorage.setItem('reader_link_host','192.168.x.x:8787')`, then reload.

## Current interaction
- FREQ/BAND changes are sent phone → laptop.
- LISTEN/STOP are sent phone → laptop.
- LOG ATTEMPT is sent phone → laptop.
- Hold the **Option/Alt key on the laptop** to reveal the temporary plain-language explanation.
- Laptop asks the phone for a Gemma response after a logged observation.
- If the native Android Gemma bridge is not installed yet, the phone returns a clearly marked fallback.

## Gemma
The web Reader deliberately does **not** pretend to run Gemma itself. The intended final architecture is:

`Android WebView → JavascriptInterface (GemmaBridge) → LiteRT-LM → Gemma 4 E2B → GemmaBridgeResponse() → WebSocket → laptop`

The next step is to put the Reader web page inside a small Android app and connect `GemmaBridge.generate()` to LiteRT-LM.
