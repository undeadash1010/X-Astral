const { commands, Meta } = require('../lib/commands');
const config = require('../config.js');
const { writeFileSync } = require('fs');
const { MessageType, Mimetype } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const { SpeechClient } = require('@google-cloud/speech');
const speechClient = new SpeechClient();

Meta({
    command: 'removebg',
    category: 'media',
    filename: 'removebg',
    handler: async (sock, message, author, args, quoted, languages) => {
        const { from } = message;
        if (!quoted || quoted.mtype !== 'imageMessage') {
            return await sock.sendMessage(from, { text: languages[config.LANGUAGE].IMAGE_MSG }, MessageType.text);
        }      const media_data = await sock.downloadMediaMessage(quoted);
        if (!media_data) {
        } try {
            const formData = new FormData();
            formData.append('image', media_data, 'image.png');
            const { data } = await axios.post('https://api.deepai.org/api/remove-bg', formData, {
                headers: { 'Api-Key': config.DEEPAI_KEY, ...formData.getHeaders() }
            }); if (data.output_url) {
                 const res_str = await axios.get(data.output_url, { responseType: 'arraybuffer' });
                await sock.sendMessage(from, { image: res_str.data, caption: '*Made with love*' }, MessageType.image);
            } else {}
        } catch (error) {
            console.error(error);
          }
    }
});

Meta({
    command: 'video2gif',
    category: 'media',
    handler: async (sock, args, message, languages) => {
        const { from } = message;
        if (!message.message || !message.message.videoMessage) {
            return sock.sendMessage(from, { text: languages[config.LANGUAGE].VIDEO_MSG}, MessageType.text);
        } const video_togif = await sock.downloadMediaMessage(message);
        const video_xv = path.join(__dirname, 'input.mp4');
        const gif_naxor = path.join(__dirname, 'output.gif');
        fs.writeFileSync(video_xv, video_togif);
        ffmpeg(video_xv)
            .setStartTime('00:00:05')
            .setDuration(5) 
            .toFormat('gif')
            .save(gif_naxor)
            .on('end', async () => {
                const gif_naxors = fs.readFileSync(gif_naxor);
                await sock.sendMessage(from, { video: gif_naxors, caption: '*Made with love*', gifPlayback: true }, MessageType.video);
         fs.unlinkSync(video_);
                fs.unlinkSync(gif_naxor);
            })
            .on('error', async (err) => {
                console.error(err);
                });
    }
});

Meta({
    command: 'resize',
    category: 'media',
    handler: async (sock, args, message, languages) => {
        const { from } = message;
        const [width, height] = args;
        if (!width || !height || isNaN(width) || isNaN(height)) {
            return sock.sendMessage(from, { text: 'Please specify valid width and height e.g: /resize 300 300' }, { quoted: message });
        } if (!message.message || !message.message.imageMessage) {
            return sock.sendMessage(from, { text: languages[config.LANGUAGE].IMAGE_MSG }, { quoted: message });
        } const image_res = await sock.downloadMediaMessage(message); 
        try { const ffmpegProcess = spawn('ffmpeg', [
                '-i', 'pipe:0',                   
                '-vf', `scale=${width}:${height}`, 
                '-f', 'image2',                    
                'pipe:1'                           
            ]); ffmpegProcess.stdin.write(image_res);
            ffmpegProcess.stdin.end();
            let outputBuffer = [];
            ffmpegProcess.stdout.on('data', (chunk) => {
                outputBuffer.push(chunk);
            }); ffmpegProcess.stdout.on('end', async () => {
                const res_nes = Buffer.concat(outputBuffer); 
                await sock.sendMessage(from, { image: res_nes, caption: '*Resized with ❤️*' }, { quoted: message });
            });
            ffmpegProcess.stderr.on('data', (data) => {
                console.error(`${data}`);
            });
        } catch (err) {
            console.error(err);
        }
    }
});
            
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

Meta({
    command: 'sticker',
    category: 'media',
    handler: async (sock, args, message, languages) => {
        const { from } = message;

        if (!message.message || !(message.message.imageMessage || message.message.videoMessage || message.message.gifMessage)) {
            return sock.sendMessage(from, { text: '*Please send an image, video, or GIF*' }, { quoted: message });
        } const media = await sock.downloadMediaMessage(message); 
        let Options = {
            pack: config.PACKNAME || 'Naxor_Ser❤️',         
            author: config.AUTHOR_PACK || 'Astral_Bot❤️',   
            quality: 80,              
            type: StickerTypes.FULL,  
            categories: ['👀', '👌'],
        }; if (message.message.imageMessage) {
             Options.type = StickerTypes.FULL; 
        } else if (message.message.videoMessage || message.message.gifMessage) {
           Options.type = StickerTypes.FULL; 
            Options.animated = true;         
        }  const sticker = new Sticker(media, Options);
        const ztr_skk = await sticker.toBuffer();
        await sock.sendMessage(from, {
            sticker: ztr_skk,
            mimetype: 'image/webp',
            contextInfo: {
                externalAdReply: {
                    title: 'Created',
                    body: 'Done',
                    mediaType: 2,
                    sourceUrl: '', 
                }
            }
        }, { quoted: message });
    }
});          

Meta({
    command: 'steal',
    category: 'media',
    handler: async (sock, args, message, languages) => {
        const { from, quotedMessage } = message;
        if (!quotedMessage || !(quotedMessage.stickerMessage || quotedMessage.videoMessage || quotedMessage.gifMessage)) {
            return sock.sendMessage(from, { text: '*_Please reply to a sticker, video, or GIF_*' }, { quoted: message });
        } if (args.length === 0 || !args.includes('||')) {
            return sock.sendMessage(from, { text: 'e.g/ steal <packName> || <authorName>' }, { quoted: message });
        }   const [packName, authorName] = args.join(' ').split(' || ').map(arg => arg.trim());
        if (!packName || !authorName) {
            return sock.sendMessage(from, { text: 'provide_pack name and_author name' }, { quoted: message });
        } const media = await sock.downloadMediaMessage(quotedMessage);
        let stickerz = {
            pack: packName,
            author: authorName,
            quality: 80,
            type: StickerTypes.FULL, 
            categories: ['🌟'], 
        };
        if (quotedMessage.stickerMessage) {
            stickerz.type = StickerTypes.FULL;
        } else if (quotedMessage.videoMessage || quotedMessage.gifMessage) {
            stickerz.type = StickerTypes.FULL; 
            stickerz.animated = true;          
        }  const van = new Sticker(media, stickerz);
        const diego = await van.toBuffer();
        await sock.sendMessage(from, {
            sticker: diego,
            mimetype: 'image/webp',
            contextInfo: {
                externalAdReply: {
                    title: 'Stolen',
                    body: `${packName}|${authorName}`,
                    mediaType: 2,
                    sourceUrl: '', 
                }
            }
        }, { quoted: message });
    }
});
                    
let polls = {};
Meta({
  command: 'vote',
  category: 'group',
  handler: async (sock, message, isGroup, args, languages) => {
    const { key, from, message: msg } = message;
    const input = args;
    if (!isGroup) {
      return await sock.sendMessage(from, {
        text: languages[config.LANGUAGE].GROUP_MSG }, { quoted: message });
    }if (!input) {
      return await sock.sendMessage(from, { 
        text: 'Usage: !vote <topic> to create a poll, !vote <option> to vote' }, { quoted: message });
    } if (!polls[from]) {
      polls[from] = {
        topic: input,
        options: {},
        voters: []
      };
      await sock.sendMessage(from, { text: `Poll created: ${input}\n\nTo vote, use: !vote <option>` }, { quoted: message });
    } else {
      const poll = polls[from];
      if (poll.voters.includes(key.participant)) {
        return await sock.sendMessage(from, { text: 'You have already voted in this poll' }, { quoted: message });
      }
      poll.options[input] = (poll.options[input] || 0) + 1;
      poll.voters.push(key.participant);
      let result = `*Poll:* ${poll.topic}\n\n`;
      for (let option in poll.options) {
        result += `*${option}:* ${poll.options[option]} votes\n`;
      }
      await sock.sendMessage(from, { text: result }, { quoted: message });
    }
  }
});
  
Meta({
    command: 'animsticker',
    category: 'media',
    handler: async (sock, args, message, languages) => {
      const { from } = message;
        if (!message.message || (!message.message.videoMessage && !message.message.imageMessage)) {
            return sock.sendMessage(from, { text: languages[config.LANGUAGE].VIDEO_MSG}, MessageType.text);
        }
        const isVideo = message.message.videoMessage !== undefined;
        const media_msg = isVideo ? message.message.videoMessage : message.message.imageMessage;
        const mime = media_msg.mimetype;
      if (!/video|gif/.test(mime)) {
            return sock.sendMessage(from, { text: languages[config.LANGUAGE].VALID_MSG}, MessageType.text);
        }
        const media_fire = await sock.downloadMediaMessage(message);
        const tempFile = `./temp_media_${Date.now()}.${isVideo ? 'mp4' : 'gif'}`;
        const output = `./temp_sticker_${Date.now()}.webp`;
        fs.writeFileSync(tempFile, media_fire);

        try {
             await new Promise((resolve, reject) => {
                ffmpeg(tempFile)
                    .inputFormat(isVideo ? 'mp4' : 'gif')
                    .toFormat('webp')
                    .videoFilters('scale=512:512')
                    .outputOptions(['-vcodec', 'libwebp', '-lossless', '1', '-qscale', '0', '-preset', 'default', '-loop', '0', '-an', '-vsync', '0'])
                    .save(output)
                    .on('end', resolve)
                    .on('error', reject);
            });
             const sticker_str = fs.readFileSync(output);
            await sock.sendMessage(from, { sticker: sticker_str }, MessageType.sticker);
        } catch (err) {
            console.error(err);
         } finally {
        await unlinkAsync(tempFile);
            await unlinkAsync(output);
        }
    }
});

Meta({
    command: 'transcribe',
    category: 'media',
    handler: async (sock, args, message, languages) => {
      const { from } = message;
        if (!message.message || !message.message.audioMessage) {
            return sock.sendMessage(from, { text: languages[config.LANGUAGE].AUDIOS_MSG }, MessageType.text);
        }
        const audio_str = await sock.downloadMediaMessage(message);
        const audio_cn = path.join(__dirname, 'audio.ogg');
        fs.writeFileSync(audio_cn, audio_str);
        const audio = fs.readFileSync(audio_cn);
        const request = {
            audio: {
                content: audio.toString('base64'),
            },
            config: {
                encoding: 'OGG_OPUS',
                sampleRateHertz: 16000,
                languageCode: 'en-US',
            },
        };
        try {
            const [response] = await speechClient.recognize(request);
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');
            await sock.sendMessage(from, { text: `*X*\n${transcription}` }, MessageType.text);
        } catch (err) {
            console.error(err);
            } fs.unlinkSync(audio_cn);
    }
});
                                    
      
