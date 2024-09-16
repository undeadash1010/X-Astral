// ⍗

const { Meta } = require('../lib/');
const axios = require('axios');
const { DL_API } = require('../config');

Meta({
  command: 'yts',
  category: 'search',
  usage: '+ query',
  handler: async (sock, message, args) => {
    const { from } = message;
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(from, { text: '*_Please provide a search query_*' });
    } try {
      const res = await axios.get(`${DL_API}/api/search/yts?query=${query}`);
      const { videos } = res.data;
      if (videos.length === 0) {
        return sock.sendMessage(from, { text: 'no_gay' });
      } const video = videos[0];
      let naxor = `*YTS Search Results:* _${query}_\n\n`;
      videos.slice(0, 5).forEach((video, index) => {
        naxor += `*${index + 1}.* [${video.title}]\n`;
        naxor += `(${video.url})\n`;
        naxor += `*⍗Duration:* ${video.duration}\n`;
        naxor += `*⍗Views:* ${video.views}\n\n`;
      }); await sock.sendMessage(from, { 
        text: naxor,
        contextInfo: {
          externalAdReply: {
            title: video.title,
            body: `⍗Duration: ${video.duration} | ⍗Views: ${video.views}`,
            mediaType: 1,
            thumbnailUrl: video.thumbnail, 
            mediaUrl: video.url, 
            sourceUrl: video.url
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  }
});
