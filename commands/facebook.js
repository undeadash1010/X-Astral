const { Meta } = require('../lib/');
const axios = require('axios');
const { DL_API } = require('../config');

Meta({
    command: 'fb',
    category: 'downloads',
    usage: 'cmd$url',
    handler: async (sock, message, args) => {
        const { from } = message;
        const dl_fb = args[0];
        if (!dl_fb) {
            return sock.sendMessage(from, { text: '_Provide a valid fb url_' });
        } try {
            const res = await axios.get(`${DL_API}/api/download/fb_dl?url=${dl_fb}`);
            const { owner_name, results } = res.data;
            if (!results || results.length === 0) {
                return sock.sendMessage(from, { text: 'No gay_' });
            } const video = results[0];
            if (!video.downloads || video.downloads.length === 0) {
                return sock.sendMessage(from, { text: 'No_gay' });
            } const Qualit = video.downloads.reduce((prev, current) => {
                return (prev.quality.includes('HD') && !current.quality.includes('HD')) ? prev : current;
            });
            return sock.sendMessage(from, {
                video: Qualit.url,
                caption: `*Owner:* ${owner_name}\n*Download:* ${Qualit.dl_title}`
            });
        } catch (error) {
            console.error(error);
            }
    }
});
            
