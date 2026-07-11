const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const GIT_JSON_URL = 'https://raw.githubusercontent.com/STrLuX/PDS-Bot/main/materials.json';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  },
});

client.on('qr', (qr) => {
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

client.initialize();
