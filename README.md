# DACian-era
digisite artifact

# Reader Prototype

A web-based two-device prototype consisting of a **phone Reader interface** and a **laptop Field Receiver**, connected through a Node.js WebSocket server.

## What it does

The phone is used to:

* Adjust frequency and band
* Start/stop listening
* Detect a hidden audio signal
* Receive vibration feedback when near the target frequency
* Locate and mend the signal
* Enter an observation/log
* Receive a new frequency after completing an interaction

The laptop displays the shared Reader activity and field state, including:

* Element
* Frequency
* Band
* Listening state
* Reader observations/logs
* Signal/field information

## How it works

```text
PHONE READER
     │
     │ WebSocket
     ▼
NODE.JS SERVER
     │
     │ WebSocket
     ▼
LAPTOP FIELD RECEIVER
```

The server maintains the shared state between both interfaces.

## Technology

* HTML
* CSS
* JavaScript
* Node.js
* WebSocket (`ws`)
* Web Audio API
* Browser Vibration API
* LocalStorage

## Server

Main server:

```text
network/server.js
```

Run with:

```bash
node server.js
```

Server:

```text
Port: 8787
WebSocket: /ws
```

Expected output:

```text
READER SERVER RUNNING
```

## Phone

The phone interface is accessed through:

```text
/phone/index.html
```

During testing, the local server can be exposed to the phone using ngrok.

```bash
ngrok http 8787
```

## Current prototype

### Water

* Frequency range: 180–1160 Hz
* Hidden target frequency
* Audio signal
* Frequency-based detection
* Continuous vibration while within the signal range
* MEND interaction
* Observation logging
* New frequency generated after completion

## Current state

This is a functional prototype for testing the interaction between:

**frequency → listening → signal detection → vibration → mend → observation → new frequency**

The system is currently designed for local development and testing.

