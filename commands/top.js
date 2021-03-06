exports.run = (client, message, args) => {
  const Level = require('../models/levels');
  const guildID = message.guild.id;
  const { createEmbed } = require('../utils/utils');

  Level.find({ guildID })
    .sort({ experience: -1 })
    .limit(30)
    .then(levelDocs => {
      const topArray = levelDocs.map(
        (doc, index) => `${index + 1}. <@${doc.memberID}> - ${doc.experience}xp`
      );

      const embedOpts = {
        image: 'top',
        fields: [
          {
            name: `**${message.guild.name} rankings**`,
            value: topArray.join('\n')
          }
        ]
      };

      message.channel
        .send(createEmbed(embedOpts))
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
};
