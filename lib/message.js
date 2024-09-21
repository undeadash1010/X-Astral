const { downloadContentFromMessage, getContentType } = require("baileys");
const fs = require("fs").promises;
const config = require("../config");

const mimeTypes = new Map([
  ["imageMessage", "image"],
  ["videoMessage", "video"],
  ["stickerMessage", "sticker"],
  ["documentMessage", "document"],
  ["audioMessage", "audio"],
]);

async function fetchMedia(msg, filePath) {
  try {
    let messageType = Object.keys(msg)[0];
    let currentMsg = msg;
    if (messageType === "templateMessage") {
      currentMsg = msg.templateMessage.hydratedFourRowTemplate;
      messageType = Object.keys(currentMsg)[0];
    }
    if (messageType === "interactiveResponseMessage") {
      currentMsg = msg.interactiveResponseMessage;
      messageType = Object.keys(currentMsg)[0];
    }
    if (messageType === "buttonsMessage") {
      currentMsg = msg.buttonsMessage;
      messageType = Object.keys(currentMsg)[0];
    }
    const mimeType = mimeTypes.get(messageType);
    const stream = await downloadContentFromMessage(currentMsg[messageType], mimeType);
    const bufferArray = [];
    for await (const chunk of stream) {
      bufferArray.push(chunk);
    }
    if (filePath) {
      await fs.writeFile(filePath, Buffer.concat(bufferArray));
      return filePath;
    } else {
      return Buffer.concat(bufferArray);
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function serialize(msg, sock) {
  sock.logger = { info() {}, error() {}, warn() {} };
  if (msg.key) {
    msg.id = msg.key.id;
    msg.isSelf = msg.key.fromMe;
    msg.from = msg.key.remoteJid;
    msg.isGroup = msg.from.endsWith("@g.us");
    msg.sender = msg.isGroup ? msg.key.participant : (msg.isSelf ? sock.user.id : msg.from);
    try {
      msg.isSudo = config.MODS.split(",").includes(parsedJid(msg.sender)[0].split("@")[0]) || msg.key.fromMe;
    } catch {
      msg.isSudo = false;
    }
  }

  if (msg.message) {
    msg.type = getContentType(msg.message);
    try {
      msg.mentions = msg.message[msg.type]?.contextInfo?.mentionedJid || [];
    } catch {
      msg.mentions = [];
    }
    try {
      const quotedInfo = msg.message[msg.type]?.contextInfo;
      if (quotedInfo && quotedInfo.quotedMessage) {
        const quotedMessage = quotedInfo.quotedMessage;
        let quotedType = Object.keys(quotedMessage)[0];
        if (quotedMessage["ephemeralMessage"]) {
          quotedType = Object.keys(quotedMessage.ephemeralMessage.message)[0];
          msg.quoted = {
            type: quotedType === "viewOnceMessageV2" ? "view_once" : "ephemeral",
            stanzaId: quotedInfo.stanzaId,
            sender: quotedInfo.participant,
            message: quotedType === "viewOnceMessageV2" 
              ? quotedMessage.ephemeralMessage.message.viewOnceMessageV2.message 
              : quotedMessage.ephemeralMessage.message,
          };
        } else {
          msg.quoted = {
            type: quotedMessage["viewOnceMessageV2"] ? "view_once" : "normal",
            stanzaId: quotedInfo.stanzaId,
            sender: quotedInfo.participant,
            message: quotedMessage,
          };
        }

        msg.quoted.isSelf = msg.quoted.sender === sock.user.id;
        msg.quoted.mtype = Object.keys(msg.quoted.message);
        msg.quoted.text = msg.quoted.message[msg.quoted.mtype]?.text || msg.quoted.message[msg.quoted.mtype]?.caption || "";
        msg.quoted.key = { id: msg.quoted.stanzaId, fromMe: msg.quoted.isSelf, remoteJid: msg.from };
        msg.quoted.download = (filePath) => fetchMedia(msg.quoted.message, filePath);
      }
    } catch (err) {
      console.error("Quoted message error:", err);
      msg.quoted = null;
    }
    try {
      msg.body = msg.message.conversation || msg.message[msg.type]?.text || msg.message[msg.type]?.caption || false;
    } catch (err) {
      console.error(err);
      msg.body = false;
    }
    msg.download = (filePath) => fetchMedia(msg.message, filePath);
    sock.client = msg;
  }
  return msg;
}

module.exports = { serialize, fetchMedia };
