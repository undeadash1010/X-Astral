const { Meta } = require('../lib/');
const axios = require('axios');
const config = require('../config');

Meta({
    command: 'fb',
    category: 'downloads',
    usage: 'cmd$url',
    handler: async (sock, message, args) => {
        const { from } = message;
        const dl_fb = args[0];
        if (!dl_fb) {
            return sock.sendMessage(from, { text: 'Provide a valid Facebook url' });
       }   const base = `config.API/api/download/fb_dl?url=${dl_fb}`;
       try {
        const res = await axios.get(base);
            const { owner_name, results } = res.data;
            if (!results || results.length === 0) {
                return sock.sendMessage(from, { text: 'No results found for the provided URL.' });
            } const video = results[0];
            if (!video.downloads || video.downloads.length === 0) {
                return sock.sendMessage(from, { text: 'No_gay' });
            }      const Qualit = video.downloads.reduce((prev, current) => {
                return (prev.quality.includes('HD') && !current.quality.includes('HD')) ? prev : current;
            });     return sock.sendMessage(from, { 
                video: Qualit.url,
                caption: `*Owner:* ${owner_name}\n*Download:* ${Qualit.dl_title}`
            });
        } catch (error) {
            console.error(error);
          }
    }
});
                                        
