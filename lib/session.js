const fs = require('fs').promises;
const path = require('path');
const { SESSION_ID } = require('../config');
const Pastebin = require('pastebin-js');
class Session {
  constructor() {
    this.pastebin = new Pastebin('bR1GcMw175fegaIFV2PfignYVtF0b_Bl');
  } async createDir() {
    await fs.mkdir('./auth_info_baileys', { recursive: true });
  } async decodeBase64(str) {
    return Buffer.from(str, 'base64').toString('utf-8');
  } async writeFile(file, data) {
    await fs.writeFile(file, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } async cleanup() {
    console.error('Invalid Session');
    try { await fs.rm('./auth_info_baileys', { recursive: true, force: true });
      console.log('Session directory deleted');
    } catch (err) {
      console.error(err);
    } process.exit(1);
  }

  async connect(id = SESSION_ID) {
    try { await this.createDir();
      const trimmedId = id.replace(/Session~/gi, "").trim();
      if (trimmedId.length > 20) {
        const decoded = await this.decodeBase64(trimmedId);
        if (!decoded) {
          throw new Error('Session_error');
        } const sessionData = JSON.parse(decoded);
        if (sessionData['creds.json']) {
          for (const [file, data] of Object.entries(sessionData)) {
            await this.writeFile(`./auth_info_baileys/${file}`, data);
          }
        } else {
          await this.writeFile('./auth_info_baileys/creds.json', sessionData);
        }} else {
        const paste = await this.pastebin.getPaste(trimmedId);
        if (!paste) {
          throw new Error('Invalid session ID');
        } await this.writeFile('./auth_info_baileys/creds.json', paste.toString());
      }} catch (err) {
      console.error(err.message);
      await this.cleanup();
    }
  }
}

const session = new Session();
module.exports = session;
