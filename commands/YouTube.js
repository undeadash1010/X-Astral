const { commands, Meta } = require('../lib/commands');
const {
  searchAndDownload,
  downloadYouTubeVideo,
  downloadYouTubeAudio,
  getYoutubeThumbnail,
  bytesToSize,
  generateId,
} = require('../lib/youtubei.js');
const fs = require('fs');
const path = require('path');

Meta({
  command: 'song',
  category: 'youtube',
  handler: async (sock, message, args) => {
    try {
      const { from } = message;
      const queryUrl = args.join(' ').trim();
      if (!queryUrl) {
        return await sock.sendMessage(from, {
          text: 'Provide YouTube url/song name',
        });
      }

      const outputFilePath = path.join(__dirname, 'temp_audio.mp3');
      if (queryUrl.startsWith('http')) {
        await downloadYouTubeAudio(queryUrl, outputFilePath);
      } else {
        await searchAndDownload(queryUrl, outputFilePath, 'audio');
      }  if (fs.existsSync(outputFilePath)) {
        const stats = fs.statSync(outputFilePath);
        const fileSize = bytesToSize(stats.size);
        const audioId = generateId(queryUrl);
        const thumbnailId = await getYoutubeThumbnail(audioId);
        await sock.sendMessage(from, {
          audio: { url: outputFilePath },
          mimetype: 'audio/mp4',
          caption: `*_Name_*: ${path.basename(outputFilePath)}\n*_Size_*: ${fileSize}\n*_Bytes_*: ${stats.size}\n*_ID_*: ${audioId}`,
          externalAdReply: {
            title: 'Mp3_Down',
            body: 'Downloaded',
            thumbnail: { url: thumbnailId },
          },
        });

        fs.unlinkSync(outputFilePath);
      }
    } catch (error) {
      await sock.sendMessage(from, { text: `${error.message}` });
    }
  },
});

Meta({
  command: 'yta',
  category: 'youtube',
  handler: async (sock, message, args) => {
    try {
      const { from } = message;
      const audioUrl = args.join(' ').trim();
      if (!audioUrl) {
        return await sock.sendMessage(from, {
          text: 'Provide YouTube url',
        });
      }

      const filePath = path.join(__dirname, 'temp_audio.mp3');
      await downloadYouTubeAudio(audioUrl, filePath);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileSize = bytesToSize(stats.size);
        const audioId = generateId(audioUrl);
        const thumbnailId = await getYoutubeThumbnail(audioId);

        await sock.sendMessage(from, {
          audio: { url: filePath },
          mimetype: 'audio/mp4',
          caption: `*_Name_*: ${path.basename(filePath)}\n*_Size_*: ${fileSize}\n*_Bytes_*: ${stats.size}\n*_ID_*: ${audioId}`,
          externalAdReply: {
            title: 'Audio_Mp3',
            body: 'Done',
            thumbnail: { url: thumbnailId },
          },
        });

        fs.unlinkSync(filePath);
      }
    } catch (error) {
      await sock.sendMessage(from, { text: `${error.message}` });
    }
  },
});

Meta({
  command: 'ytv',
  category: 'youtube',
  handler: async (sock, message, args) => {
    try {
      const { from } = message;
      const videoUrl = args.join(' ').trim();
      if (!videoUrl) {
        return await sock.sendMessage(from, {
          text: 'Provide YouTube url',
        });
      }

      const filePath = path.join(__dirname, 'temp_video.mp4');
      await downloadYouTubeVideo(videoUrl, filePath);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileSize = bytesToSize(stats.size);
        const videoId = generateId(videoUrl);

        await sock.sendMessage(from, {
          video: { url: filePath },
          mimetype: 'video/mp4',
          caption: `✗ *V I D - D O W N*\n\n*Name*: ${path.basename(filePath)}\n*Size*: ${fileSize}\n*Bytes*: ${stats.size}\n*ID*: ${videoId}`,
        });

        fs.unlinkSync(filePath);
      }
    } catch (error) {
      await sock.sendMessage(from, { text: `${error.message}` });
    }
  },
});

Meta({
  command: 'video',
  category: 'youtube',
  handler: async (sock, message, args) => {
    try {
      const { from } = message;
      const search = args.join(' ').trim();
      if (!search) {
        return await sock.sendMessage(from, {
          text: 'Provide name/url',
        });
      }

      const filePath = path.join(__dirname, 'temp_video.mp4');
      if (search.startsWith('http')) {
        await downloadYouTubeVideo(search, filePath);
      } else {
        await searchAndDownload(search, filePath, 'video');
      }   if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileSize = bytesToSize(stats.size);
        const videoId = generateId(search);

        await sock.sendMessage(from, {
          video: { url: filePath },
          mimetype: 'video/mp4',
          caption: `✗ *V I D - D O W N*\n\n*Name*: ${path.basename(filePath)}\n*Size*: ${fileSize}\n*Bytes*: ${stats.size}\n*ID*: ${videoId}`,
        });

        fs.unlinkSync(filePath);
      }
    } catch (error) {
      await sock.sendMessage(from, { text: `${error.message}` });
    }
  },
});
