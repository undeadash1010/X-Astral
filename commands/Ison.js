const { commands, Meta } = require('../lib/');
const config = require('../config.js');
const { jidDecode } = require('@adiwajshing/baileys');

Meta({
  command: 'ison',
  category: 'utility',
  handler: async (sock, message, args, isGroup) => {
    const { from } = message;
    
    const numbers = args.input.trim().split(' ').slice(1);
    if (numbers.length === 0) {
        return await sock.sendMessage(from, {
        text: `*Usage:* ${config.PREFIX}ison 27686881×××`,
        quoted: message
      });
    }
    let res_matched = '*WhatsApp Num Ison:*\n\n';
    const results = [];
    for (const number of numbers) {
      const id = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
      try {
        const status = await sock.onWhatsApp(id);
        if (status && status.length > 0) {
          const [contactInfo] = status;
          const { jid, status: about, statusTimestamp } = await sock.fetchStatus(contactInfo.jid);
          const Date_Jid = new Date(statusTimestamp * 1000).toLocaleString();  
          const parsedJid = jidDecode(jid);
          results.push({
            jid: parsedJid.user + '@' + parsedJid.server,
            number: parsedJid.user,
            about: about || 'No status',
            date: statusTimestamp ? Date_Jid : '_Non_',
          });

          res_matched += '*Number:* ' + parsedJid.user + '\n' +
                         '*Id:* ' + parsedJid.user + '@' + parsedJid.server + '\n' +
                         '*About:* ' + (about || 'No status') + '\n' +
                         '*Status_On:* ' + Date_Jid + '\n' +
                         '─────────────────────\n';
        } else {
          res_matched += '- ' + number + ': Not Registered on WhatsApp\n';
        }
      } catch (error) {
        res_matched += '- ' + number + ': Error\n';
      }
    } if (results.length > 0) {
      res_matched += '\n*Total:* ' + results.length;
    } else {
      res_matched = 'No WhatsApp accounts found for the provided *num*';
    } await sock.sendMessage(from, { text: res_matched }, { quoted: message });
  }
});
