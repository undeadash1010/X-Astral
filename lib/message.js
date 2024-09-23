const { proto, getContentType, jidDecode, downloadContentFromMessage } = require('@whiskeysockets/baileys');  
const decodeJid = (jid) => {  
  const { user, server } = jidDecode(jid) || {};  
  return user && server ? `${user}@${server}`.trim() : jid;  
};  
const downloadMedia = async (message) => {  
  const type = Object.keys(message)[0];  
  const msg = message[type];  
  if (type === 'buttonsMessage' || type === 'viewOnceMessageV2') {  
   const innerMessage = msg[type];  
   const innerType = Object.keys(innerMessage || {})[0];  
   const stream = await downloadContentFromMessage(innerMessage, innerType.replace('Message', ''));  
   let buffer = Buffer.from([]);  
   for await (const chunk of stream) {  
    buffer = Buffer.concat([buffer, chunk]);  
   }  
   return buffer;  
  }  
  const stream = await downloadContentFromMessage(msg, type.replace('Message', ''));  
  let buffer = Buffer.from([]);  
  for await (const chunk of stream) {  
   buffer = Buffer.concat([buffer, chunk]);  
  }  
  return buffer;  
};  
  
function serialize(msg, sock) {  
  if (msg.key) {  
   msg.id = msg.key.id;  
   mag.isSelf = msg.key.fromMe;  
   msg.from = decodeJid(msg.key.remoteJid);  
   msg.isGroup = msg.from.endsWith('@g.us');  
   msg.sender = msg.isGroup ? decodeJid(msg.key.participant) : msg.isSelf ? decodeJid(sock.user.id) : msg.from;  
  }  
  if (msg.message) {  
   msg.type = getContentType(msg.message);  
   if (msg.type === 'ephemeralMessage' || msg.type === 'viewOnceMessageV2') {  
    const innerMessage = msg.message[msg.type].message;  
    msg.type = getContentType(innerMessage);  
    msg.message = innerMessage;  
   }  
   msg.messageTypes = (type) => ['videoMessage', 'imageMessage'].includes(type);  
   try {  
    const quoted = msg.message[msg.type]?.contextInfo;  
    if (quoted.quotedMessage['ephemeralMessage'] || quoted.quotedMessage['viewOnceMessageV2']) {  
      const innerQuotedMessage = quoted.quotedMessage[quoted.quotedMessage['ephemeralMessage'] ? 'ephemeralMessage' : 'viewOnceMessageV2'].message;  
      msg.quoted = {  
       type: quoted.quotedMessage['ephemeralMessage'] ? 'ephemeral' : 'view_once',  
       stanzaId: quoted.stanzaId,  
       participant: decodeJid(quoted.participant),  
       message: innerQuotedMessage,  
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
    msg.quoted.mtype = Object.keys(msg.quoted.message).filter((v) => v.includes('Message') || v.includes('conversation'))[0];  
    msg.quoted.text =  
      msg.quoted.message[msg.quoted.mtype]?.text ||  
      msg.quoted.message[msg.quoted.mtype]?.description ||  
      msg.quoted.message[msg.quoted.mtype]?.caption ||  
      msg.quoted.message[msg.quoted.mtype]?.hydratedTemplate?.hydratedContentText ||  
      msg.quoted.message[msg.quoted.mtype] ||  
      '';  
    msg.quoted.key = {  
      id: msg.quoted.stanzaId,  
      fromMe: msg.quoted.isSelf,  
      remoteJid: msg.from,  
    };  
    msg.quoted.download = () => downloadMedia(msg.quoted.message);  
   } catch {  
    msg.quoted = null;  
   }  
   msg.body =  
    msg.message?.conversation ||  
    msg.message?.[msg.type]?.text ||  
     msg.message?.[msg.type]?.caption ||  
    (msh.type === 'listResponseMessage' && msg.message?.[msg.type]?.singleSelectReply?.selectedRowId) ||  
    (msg.type === 'buttonsResponseMessage' && msg.message?.[msg.type]?.selectedButtonId) ||  
    (msg.type === 'templateButtonReplyMessage' && msg.message?.[msg.type]?.selectedId) ||  
    '';  
   msg.reply = (text) =>  
    sock.sendMessage(  
      msg.from,  { text,}, {  
       quoted: msg,  
      });  
   msg.mentions = [];  
   if (msg.quoted?.participant) msg.mentions.push(msg.quoted.participant);  
   const array = msg?.message?.[msg.type]?.contextInfo?.mentionedJid || [];  
   msg.mentions.push(...array.filter(Boolean));  
   msg.download = () => downloadMedia(msg.message);  
   msg.numbers = sock.utils.extractNumbers(msg.body);  
   msg.urls = sock.utils.extractUrls(msg.body);  
  }  
  return msg;  
}  
  
module.exports = {  
  serialize,  
  decodeJid,  
};
    
