const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cors = require('cors');
process.env.CLIENT_ORIGIN = ' https://extra.example/ , ';
const options = require('../config/corsConfig');

test('CORS allows the production site and preflight but not unrelated origins', async () => {
  const app = express();
  app.use(cors(options));
  app.get('/health', (req,res) => res.json({success:true}));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/health`;
  try {
    for (const origin of ['https://cinelog-two.vercel.app', 'https://extra.example', 'http://127.0.0.1:5173']) {
      const response = await fetch(url, {headers:{Origin:origin}});
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
    }
    const preflight = await fetch(url, {method:'OPTIONS',headers:{Origin:'https://cinelog-two.vercel.app','Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization,content-type'}});
    assert.equal(preflight.status,200);
    assert.equal(preflight.headers.get('access-control-allow-origin'),'https://cinelog-two.vercel.app');
    assert.match(preflight.headers.get('access-control-allow-headers'), /authorization/i);
    const denied = await fetch(url, {headers:{Origin:'https://unrelated.example'}});
    assert.equal(denied.headers.get('access-control-allow-origin'),null);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
