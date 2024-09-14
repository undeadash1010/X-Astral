const { Meta } = require('../lib/');
const axios = require('axios');

Meta({
    command: 'fb',
    category: 'downloads',
    usage: 'cmd$url [quality]',
    handler: async (sock, message, args) => {
        const { from } = message;
        const dl_fb = args[0];
        const quality = args[1] || '720p(HD)'; 
        if (!dl_fb) {
            return sock.sendMessage(from, { text: 'Provide a valid Facebook video_url' });
        } const base = `config.API/api/download/fb_dl?url=${encodeURIComponent(dl_fb)}`;
          try { const res = await axios.get(base);
            const { owner_name, results } = res.data;
            if (!results || results.length === 0) {
                return sock.sendMessage(from, { text: 'gay_nothing' });
            }  const video = results[0];
            const Qualit = video.downloads.find(d => d.quality === quality);
            if (!Qualit) {             
            }  return sock.sendMessage(from, { 
                video: Qualit.dl_url,
                caption: `*Owner: + * ${owner_name} + \n*Download:* + ${Qualit.dl_name}`
            });
        } catch (error) {
            console.error(error);
            }
    }
});
          
