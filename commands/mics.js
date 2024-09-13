const axios = require('axios');
const config = require('../config');
const { Meta } = require('../lib/');

Meta({
    command: 'quote',
    category: 'fun',
    handler: async (sock, message) => {
        const { from } = message;
        const res_str = await axios.get('https://api.quotable.io/random');
        const quote = res_str.data;
        await sock.sendMessage(from, { text: `"${quote.content}" - *${quote.author}*` });
    }
});

Meta({
    command: 'translate',
    category: 'mics',
    handler: async (sock, message, args) => {
        const { from } = message;
        const [targetLang, ...text] = args;
        const textToTranslate = text.join(' ');
        if (!targetLang || !textToTranslate) {
            return sock.sendMessage(from, { text: 'use: *translate* <language-code> <text>' });
        }    const res_stz = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|${targetLang}`);
        const naxors = res_stz.data.responseData.translatedText;
        await sock.sendMessage(from, { text: naxors });
    }
});

Meta({
  command: 'mods',
  category: 'mics',
  usage: 'prefix$mods',
  handler: async (sock, message, args) => {
    const { from } = message;
    const mods = process.env.MODS ? JSON.parse(process.env.MODS) : [];
    const mod_str = mods.length > 0
      ? mods.map(mod => `🛡️ ${mod}`).join('\n')
      : 'no_mods';
    await sock.sendMessage(from, { text: `*MODES_SUDOS:*\n\n${mod_str}`, mentions: mods });
  }
});
