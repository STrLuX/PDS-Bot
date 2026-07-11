const http = require('http');
const assert = require('assert');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
};

const req = http.request(options, (res) => {
  assert.strictEqual(res.statusCode, 200, 'Expected status code 200');
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const response = JSON.parse(data);
    assert.deepStrictEqual(response, { status: 'ok' }, 'Expected response to be { status: "ok" }');
    console.log('Test passed!');
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Test failed:', error.message);
  process.exit(1);
});

req.end();
