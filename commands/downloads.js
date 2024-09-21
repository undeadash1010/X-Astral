const { commands, Meta, toTiny } = require('../lib');
const config = require('../config');
const { IMAGE_DOWN } = require('./FUNCS_DATA/img_down.js');
const axios = require('axios');

Meta({
  command: "ringtone",
  category: "media",
  usage: '+ query',
  handler: async (sock, args, message, reply) => {
    const { from } = message;
    const query = args[1] || "Goku"; 
    const fetched = async () => {
      const res = await axios.get(`https://x-astral.apbiz.xyz/api/search/ringtone?query=${query}`);
      return res.data;
    }; fetched()
      .then(ringtones => {
        if (ringtones.length === 0) {
          await reply("No_gay");
        } const ringtone = ringtones[0];
        const audios = ringtone.audio;
        return sock.sendMessage(from, { audio: { url: audios }, mimetype: 'audio/mp3',
          ptt: false
        });
      })
      .catch(error => {
        console.error(error);
      });
  }
});
  
Meta({
  command: 'img',
  category: 'downloads',
  filename: __filename,
  handler: async (sock, message, args, languages) => {
    const { from } = message;
    if (!args.length) { await sock.sendMessage(from, { text: languages[config.LANGUAGE].DOWNLOAD.MSG});
      return; } const query = args.join(' ');
    try { const imagees = await IMAGE_DOWN(query);
      if (imagees.length > 0) {
        for (let i = 0; i < imagees.length && i < 5; i++) {
          const image_down = imagees[i];
        await sock.sendMessage(from, { image: { url: image_down } }, { quoted: message });
        }
      } else {}
    } catch (error) {
      console.error(error);
    }
  },
});

Meta({
  command: 'apk',
  category: 'downloads',
  handler: async (sock, message, args, reply) => {
    const { from } = message;
    const query = args.join(' ');
    if (!query) { return await sock.sendMessage(from, { text: 'Please provide the name of the *app*' });
    } try { const res = await axios.get(`https://x-astral.apbiz.xyz/api/download/aptoide?query=${query}`);
      const menu = res.data.results;
      if (!menu || menu.length === 0) {
        await reply('No_gay');
        } const apk = menu[0];
      const down = apk.download;
      const names = `${apk.name}.apk`;
      const image = apk.icon;  
      const caption = `*${toTiny(apk.name)}*\n\n${toTiny('Package')}: ${toTiny(apk.package)}\n${toTiny('Developer')}: ${toTiny(apk.developer.name)}\n${toTiny('Rating')}: ${toTiny(apk.rating.avg)}`;
      await sock.sendMessage(from, {
        image: { url: image }, caption: caption,
      }); const model = await axios({ url: down, method: 'GET',
        responseType: 'stream',
      }); await sock.sendMessage(from, { document: model.data,
            mimetype: 'application/vnd.android.package-archive',
            filename: names,
      });
    } catch (error) {
      console.error(error);
      }},
        }
);

        
        
