const http = require('http');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const GIT_JSON_URL = 'https://raw.githubusercontent.com/STrLuX/PDS-Bot/main/materials.json';
const PORT = Number(process.env.PORT || 3000);

let latestQr = null;

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.url === '/qr') {
    if (latestQr) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(latestQr);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('QR not available yet');
    }
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('PDS bot is running');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.CHROMIUM_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

client.on('qr', (qr) => {
  latestQr = qr;
  console.log('Scan this QR code with your WhatsApp linked devices:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ PDS Bot is online and listening for messages!');
});

client.on('message', async (msg) => {
  if (!msg.body || !msg.body.toLowerCase().startsWith('!get ')) {
    return;
  }

  const requestedMaterial = msg.body.split(' ').slice(1).join(' ');
  const normalizedInput = requestedMaterial.toLowerCase();

  try {
    const response = await axios.get(GIT_JSON_URL);
    const materials = response.data;

    const match = Object.entries(materials).find(([name]) => name.toLowerCase() === normalizedInput);

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

client.initialize();

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});
