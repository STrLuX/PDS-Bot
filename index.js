const http = require('http');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const axios = require('axios');

const GIT_JSON_URL = 'https://raw.githubusercontent.com/STrLuX/PDS-Bot/main/materials.json';
const PORT = Number(process.env.PORT || 3000);
const macChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromiumPath = process.env.CHROMIUM_PATH ||
  (process.platform === 'darwin' && fs.existsSync(macChromePath)
    ? macChromePath
    : '/usr/bin/chromium');

let latestQr = null;
let isReady = false;

const linkingPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>PDS Bot — WhatsApp linking</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f0f2f5; color: #111b21; font: 16px system-ui, sans-serif; }
      main { width: min(420px, calc(100% - 40px)); padding: 32px; border-radius: 16px; text-align: center; background: #fff; box-shadow: 0 4px 24px #0002; }
      h1 { margin-top: 0; font-size: 24px; } #qr { width: min(100%, 320px); image-rendering: pixelated; }
      #status { color: #54656f; } .hidden { display: none; }
    </style>
  </head>
  <body>
    <main>
      <h1>Link PDS Bot to WhatsApp</h1>
      <p id="status">Preparing a secure QR code…</p>
      <img id="qr" class="hidden" alt="WhatsApp linking QR code">
      <p>WhatsApp → Settings → Linked Devices → Link a Device</p>
    </main>
    <script>
      const status = document.getElementById('status');
      const qr = document.getElementById('qr');
      async function refresh() {
        const response = await fetch('/qr.svg?time=' + Date.now(), { cache: 'no-store' });
        if (response.ok) {
          qr.src = '/qr.png?time=' + Date.now();
          qr.classList.remove('hidden');
          status.textContent = 'Scan this code from WhatsApp on your phone.';
        } else {
          qr.classList.add('hidden');
          status.textContent = await response.text();
        }
      }
      refresh();
      setInterval(refresh, 5000);
    </script>
  </body>
</html>`;

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;

  if (pathname === '/health' || pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (pathname === '/qr') {
    if (latestQr) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(latestQr);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('QR not available yet');
    }
    return;
  }

  if (pathname === '/qr.svg' || pathname === '/qr.png') {
    if (!latestQr) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(isReady ? 'WhatsApp is linked and the bot is ready.' : 'QR not available yet.');
      return;
    }

    const isPng = pathname === '/qr.png';
    const generate = isPng
      ? QRCode.toBuffer(latestQr, { type: 'png', width: 640, margin: 3 }, callback)
      : QRCode.toString(latestQr, { type: 'svg', margin: 2 }, callback);

    function callback(error, image) {
      if (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Could not generate QR code');
        return;
      }
      res.writeHead(200, {
        'Content-Type': isPng ? 'image/png' : 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(image);
    }

    generate;
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(linkingPage);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: process.env.WWEBJS_AUTH_PATH || '.wwebjs_auth',
  }),
  puppeteer: {
    executablePath: chromiumPath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-resources',
      '--no-first-run',
      '--no-default-browser-check',
    ],
  },
});

client.on('qr', (qr) => {
  latestQr = qr;
  isReady = false;
  console.log('Scan this QR code with your WhatsApp linked devices:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  latestQr = null;
  isReady = true;
  console.log('✅ PDS Bot is online and listening for messages!');
});

client.on('message', async (msg) => {
  if (!msg.body || !msg.body.toLowerCase().startsWith('/tds ')) {
    return;
  }

  const requestedMaterial = msg.body.split(' ').slice(1).join(' ');
  const normalizedInput = requestedMaterial.toLowerCase().trim();

  try {
    const response = await axios.get(GIT_JSON_URL);
    const materials = response.data;

    const match = Object.entries(materials).find(([name]) => {
      const normalizedName = name.toLowerCase().trim();
      console.log(`Comparing: "${normalizedInput}" with "${normalizedName}"`);
      return normalizedName === normalizedInput;
    });

    if (match) {
      const [, link] = match;
      msg.reply(`Here is the document for ${match[0]}:\n${link}`);
    } else {
      msg.reply(`Sorry, I couldn't find a file for "${requestedMaterial}". Please check the spelling and try again.`);
    }
  } catch (error) {
    console.error('Database Error:', error.message);
    msg.reply('Oops! Having trouble reaching the document database right now.');
  }
});

client.on('auth_failure', (message) => {
  console.error('Authentication failed:', message);
});

client.on('disconnected', (reason) => {
  console.log('Client disconnected:', reason);
});

client.on('error', (error) => {
  console.error('Client error:', error);
});

// Initialize the client, but don't crash the server if it fails
(async () => {
  try {
    console.log('Initializing WhatsApp client...');
    await client.initialize();
    console.log('WhatsApp client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize WhatsApp client:', error.message);
    console.log('Server will continue to run for health checks');
  }
})();

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
