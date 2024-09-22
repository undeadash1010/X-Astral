const { SESSION_ID } = require('../config');
const Pastebin = require('pastebin-js');

async function decodeBase64(str) {
  return Buffer.from(str, 'base64').toString('utf-8');
} function cleanup() {}
async function connect(id = SESSION_ID, pastebinClient = new Pastebin('bR1GcMw175fegaIFV2PfignYVtF0b_Bl')) {
  try { const trimmedId = id.replace(/Session~/gi, "").trim();
    if (trimmedId.length <= 20) {
      let data;
      if (trimmedId.startsWith("https://")) {
        const paste = await pastebinClient.getPaste(trimmedId);
        data = paste.toString();
      } else { data = await decodeBase64(trimmedId);
      } if (!data) {
        throw new Error('Invalid session ID');
      } const sessionData = JSON.parse(data);
        }} catch (err) {
    console.error(err.message);
    await cleanup();
  }
}

module.exports = { connect };
