# Running the Reader Prototype Locally

## Requirements

Install:

* **Node.js** — https://nodejs.org/
* A modern web browser such as Chrome, Safari, or Firefox
* A phone and laptop on the same Wi-Fi network if testing the two-device setup

Check that Node.js is installed:

```bash
node -v
npm -v
```

## 1. Open the project

Open Terminal and navigate to the `network` folder:

```bash
cd path/to/reader-prototype-WATER/network
```

## 2. Install dependencies

If the project contains `package.json`, run:

```bash
npm install
```

## 3. Start the server

Run:

```bash
node server.js
```

You should see:

```text
READER SERVER RUNNING
```

The server runs on:

```text
http://localhost:8787
```

WebSocket connection:

```text
ws://localhost:8787/ws
```

Keep this Terminal window running while using the prototype.

## 4. Open the Field Receiver

On the laptop, open:

```text
http://localhost:8787/laptop/index.html
```

## 5. Connect the phone

Find the laptop's local IP address.

### macOS

```bash
ipconfig getifaddr en0
```

If that returns nothing, try:

```bash
ipconfig getifaddr en1
```

### windows 

```bash
ipconfig
```

You will get an address, paste it 

On the phone, open:

```text
http://"your ip address here"/phone/index.html
```

Both devices must be connected to the same Wi-Fi network.

## 6. Start using the prototype

Once both interfaces are open:

```text
Laptop → Field Receiver
Phone  → Reader
```

The phone communicates with the laptop through the Node.js server.

Changes made on the Reader are sent to the Field Receiver through WebSocket.

## Optional: Using ngrok

If the phone cannot access the laptop through the local network, expose the server using ngrok:

```bash
ngrok http 8787
```

Open the HTTPS address on the phone:

```text
https://debatable-casino-lent.ngrok-free.dev/phone/index.html
```

## Stopping the server

In the Terminal running the server:

```text
Ctrl + C
```

This stops the local Reader server.
