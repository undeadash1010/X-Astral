const fs = require('fs').promises;
const { SESSION_ID } = require('../config');
const Pastebin = require('pastebin-js');

async function decodeBase64(str) {
  return Buffer.from(str, 'base64').toString('utf-8');
} async function writeFile(file, data) {
  await fs.writeFile(file, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
} async function cleanup(directory) {
  try {  await fs.rm(directory, { recursive: true, force: true });
    console.log('Session directory deleted');
  } catch (err) {
    console.error(err);
  }
}

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
      for (const [file, content] of Object.entries(sessionData)) {
        await writeFile(`../auth_info_baileys/${file}`, content);
      }} else {
      throw new Error('Session ID too long');
    }} catch (err) {
    console.error(err.message);
    await cleanup('../auth_info_baileys');
  }
}

module.exports = { connect };
