const { commands, Meta } = require('../lib/commands');
const fetch = require('node-fetch');
const jimp = require('jimp');

Meta({
  command: 'ship',
  category: 'fun',
  filename: 'funn.js',
  handler: async (sock, args, message, mentionedJid) => {
    const { from } = message;
    const mentioned = mentionedJid || [];
    if (mentioned.length !== 2) {
      await sock.sendMessage(from, { text: "Please mention two users" });
      return;
    } try { const pro_ur = await Promise.all(mentioned.map(jid => sock.profilePictureUrl(jid)));
      const avatars = await Promise.all(pro_ur.map(url => fetch(url).then(res => res.buffer())));
      const avatar1 = await jimp.read(avatars[0]);
      const avatar2 = await jimp.read(avatars[1]);
      avatar1.resize(150, 150).circle();
      avatar2.resize(150, 150).circle();
      const percentage = Math.floor(Math.random() * 101);
      const ratings = [
        'Awful', 'Very Bad', 'Poor', 'Average', 'Good',
        'Great', 'Amazing', 'XAstral', 'Virgin', 'Loser'
      ]; const rating = ratings[Math.floor(percentage / 10)];
      const ship_Card = new jimp(500, 250, '#000000');
      ship_Card.composite(avatar1, 50, 50);  
      ship_Card.composite(avatar2, 300, 50); 
      const fontBig = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
      const fontSmall = await jimp.loadFont(jimp.FONT_SANS_16_WHITE);
      ship_Card.print(fontBig, 0, 50, { text: `${percentage}%`, alignmentX: jimp.HORIZONTAL_ALIGN_CENTER }, 500);
      ship_Card.print(fontSmall, 0, 200, { text: rating, alignmentX: jimp.HORIZONTAL_ALIGN_CENTER }, 500);
      const ship_Card_Buffer = await ship_Card.getBufferAsync(jimp.MIME_PNG);
      const mention_Tags = mentioned.map(jid => `@${jid.split('@')[0]}`).join(' and ');
      const caption = `*Ship Result*\n${percentage}% Compatibility\n${mention_Tags}\n*Rating*: *${rating}*`;
      await sock.sendMessage(from, {
        image: ship_Card_Buffer,
        caption,
        mentions: mentioned
      });
    } catch (error) {
      console.error(error);
    }
  }
});
                                                                          
