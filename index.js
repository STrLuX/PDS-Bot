const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { handleMessage } = require('./src/handlers');

// Initialize the WhatsApp client with LocalAuth
const client = new Client({
    authStrategy: new LocalAuth()
});

// Generate and display QR code for authentication
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Notify when the client is ready
client.on('ready', () => {
    console.log('Client is ready!');
});

// Message handler
client.on('message', handleMessage);

// Initialize the client
client.initialize();

