const { handleTds, handleSds } = require('./commands');

const handleMessage = (message) => {
    const body = message.body.toUpperCase();
    if (body.startsWith('/TDS')) {
        handleTds(message);
    } else if (body.startsWith('/SDS')) {
        handleSds(message);
    }
};

module.exports = {
    handleMessage
};

