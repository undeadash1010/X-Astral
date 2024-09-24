const { proto, getContentType, jidDecode, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const FileType = require('file-type');
const fs = require('fs');

const decodeJid = (jid) => {
  const { user, server } = jidDecode(jid) || {};
  return user && server ? `${user}@${server}`.trim() : jid;
};

const downloadAndSaveMediaMessage = async (msg, filename, attachExtension = true) => {
  let quoted = msg.msg || msg;
  let mime = (msg.msg || msg).mimetype || "";
  let messageType = msg.mtype
    ? msg.mtype.replace(/Message/gi, "")
    : mime.split("/")[0];

  const stream = await downloadContentFromMessage(quoted, messageType);
  let buffer = Buffer.from([]);
  
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  
  let type = await FileType.fromBuffer(buffer);
  const trueFileName = attachExtension ? `${filename}.${type.ext}` : filename;
  fs.writeFileSync(trueFileName, buffer);
  return trueFileName;
};

const downloadMedia = async (msg) => {
  let type = Object.keys(msg)[0];
  let m = msg[type];

  if (type === 'buttonsMessage' || type === 'viewOnceMessageV2') {
    if (type === 'viewOnceMessageV2') {
      m = msg.viewOnceMessageV2?.message;
      type = Object.keys(m || {})[0];
    } else {
      type = Object.keys(m || {})[1];
    }
    m = m[type];
  }

  const stream = await downloadContentFromMessage(m, type.replace('Message', ''));
  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  return buffer;
};

function serialize(msg, sock) {
  if (msg.key) {
    msg.id = msg.key.id;
    msg.isSelf = msg.key.fromMe;
    msg.from = decodeJid(msg.key.remoteJid);
    msg.isGroup = msg.from.endsWith('@g.us');
    msg.sender = msg.isGroup ? decodeJid(msg.key.participant) : msg.isSelf ? decodeJid(sock.user.id) : msg.from;
  }

  if (msg.message) {
    msg.type = getContentType(msg.message);
    if (msg.type === 'ephemeralMessage') {
      msg.message = msg.message[msg.type].message;
      msg.type = Object.keys(msg.message)[0];
      if (msg.type === 'viewOnceMessageV2') {
        msg.message = msg.message[msg.type].message;
        msg.type = getContentType(msg.message);
      }
    }

    if (msg.type === 'viewOnceMessageV2') {
      msg.message = msg.message[msg.type].message;
      msg.type = getContentType(msg.message);
    }

    try {
      const quoted = msg.message[msg.type]?.contextInfo;
      if (quoted && quoted.quotedMessage) {
        if (quoted.quotedMessage.ephemeralMessage) {
          const quotedEphemeralType = Object.keys(quoted.quotedMessage.ephemeralMessage.message)[0];
          msg.quoted = {
            type: 'ephemeral',
            stanzaId: quoted.stanzaId,
            participant: decodeJid(quoted.participant),
            message: quoted.quotedMessage.ephemeralMessage.message[quotedEphemeralType],
          };
        } else if (quoted.quotedMessage.viewOnceMessageV2) {
          msg.quoted = {
            type: 'view_once',
            stanzaId: quoted.stanzaId,
            participant: decodeJid(quoted.participant),
            message: quoted.quotedMessage.viewOnceMessageV2.message,
          };
        } else {
          msg.quoted = {
            type: 'normal',
            stanzaId: quoted.stanzaId,
            participant: decodeJid(quoted.participant),
            message: quoted.quotedMessage,
          };
        }

        msg.quoted.isSelf = msg.quoted.participant === decodeJid(sock.user.id);
        msg.quoted.mtype = Object.keys(msg.quoted.message).filter(v => v.includes('Message') || v.includes('conversation'))[0];
        msg.quoted.text = msg.quoted.message[msg.quoted.mtype]?.text ||
                          msg.quoted.message[msg.quoted.mtype]?.description ||
                          msg.quoted.message[msg.quoted.mtype]?.caption ||
                          msg.quoted.message[msg.quoted.mtype]?.hydratedTemplate?.hydratedContentText || 
                          msg.quoted.message[msg.quoted.mtype] || '';
        msg.quoted.key = {
          id: msg.quoted.stanzaId,
          fromMe: msg.quoted.isSelf,
          remoteJid: msg.from,
        };
        msg.quoted.download = () => downloadMedia(msg.quoted.message);
      } else {
        msg.quoted = null;
      }
    } catch (err) {
      console.error(err);
      msg.quoted = null;
    }

    msg.body = msg.message?.conversation ||
               msg.message?.[msg.type]?.text ||
               msg.message?.[msg.type]?.caption ||
               (msg.type === 'listResponseMessage' && msg.message?.[msg.type]?.singleSelectReply?.selectedRowId) ||
               (msg.type === 'buttonsResponseMessage' && msg.message?.[msg.type]?.selectedButtonId) ||
               (msg.type === 'templateButtonReplyMessage' && msg.message?.[msg.type]?.selectedId) ||
               '';

    msg.reply = (text) => sock.sendMessage(msg.from, { text }, { quoted: msg });

    msg.mentions = [];
    if (msg.quoted?.participant) msg.mentions.push(msg.quoted.participant);
    const array = msg?.message?.[msg.type]?.contextInfo?.mentionedJid || [];
    msg.mentions.push(...array.filter(Boolean));

    msg.download = () => downloadMedia(msg.message);
  }

  return msg;
}

module.exports = {
  serialize,
  decodeJid,
};
    
