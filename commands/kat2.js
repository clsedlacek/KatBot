exports.run = (client, message, args) => {
  const { Attachment } = require('discord.js');
  const memes = require('../constants/memes');

  const meme = new Attachment(memes.kat2);

  message.channel
    .send('<@371151824331210755>', meme)
    .catch(err => console.error(err));
};
