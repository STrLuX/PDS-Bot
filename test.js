const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const GIT_JSON_URL = 'https://raw.githubusercontent.com/STrLuX/PDS-Bot/main/materials.json';

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: '.wwebjs_auth',
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--no-zygote'
    ],
  },
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', async (msg) => {
  if (!msg.body || !msg.body.toLowerCase().startsWith('!get ')) {
    return;
  }

  const requestedMaterial = msg.body.split(' ').slice(1).join(' ');
  const normalizedInput = requestedMaterial.toLowerCase().trim();

  try {
    const response = await axios.get(GIT_JSON_URL);
    const materials = response.data;

    const match = Object.entries(materials).find(([name]) => {
      const normalizedName = name.toLowerCase().trim();
      return normalizedName === normalizedInput;
    });

    if (match) {
      const [name, link] = match;
      msg.reply(`Here is the document for ${name}:\n${link}`);
    } else {
      msg.reply(`Sorry, I couldn't find a file for "${requestedMaterial}". Please check the spelling and try again.`);
    }
  } catch (error) {
    console.error('Database Error:', error.message);
    msg.reply('Oops! Having trouble reaching the document database right now.');
  }
});

client.initialize();
