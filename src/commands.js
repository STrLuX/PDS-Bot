const fs = require('fs');

// Load the materials data
const materials = JSON.parse(fs.readFileSync('materials.json', 'utf8'));
const sdsMaterials = JSON.parse(fs.readFileSync('sds_materials.json', 'utf8'));

const handleTds = (message) => {
    const parts = message.body.split(' ');
    if (parts.length < 2) {
        message.reply('Please provide a keyword. Usage: /tds <keyword>');
        return;
    }
    const keyword = parts[1].toUpperCase();
    if (materials[keyword]) {
        message.reply(materials[keyword]);
    } else {
        message.reply('Keyword not found.');
    }
};

const handleSds = (message) => {
    const parts = message.body.split(' ');
    if (parts.length < 2) {
        message.reply('Please provide a keyword. Usage: /sds <keyword>');
        return;
    }
    const keyword = parts[1].toUpperCase();
    if (sdsMaterials[keyword]) {
        message.reply(sdsMaterials[keyword]);
    } else {
        message.reply('Keyword not found.');
    }
};

module.exports = {
    handleTds,
    handleSds
};

