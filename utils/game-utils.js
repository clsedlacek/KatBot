const Discord = require('discord.js');
const EmbedConsts = require('../constants/embeds');
const levels = require('../constants/levels');
const classes = require('../constants/character-classes');
const { capitalizeFirstLetter, randomArrayIndex } = require('../utils/utils');
const Encounter = require('../models/game/encounter');

/* === STATE MANAGEMENT === */
// Sets the game state in Mongo
function setGameState(game, bool, monster = null) {
  game.monsterAlive = bool;
  game.monster = monster;

  game.save();
}

/* === EMBED CLASSES === */
// Creates a simple embed with only a single field
function gameEmbed(obj, thumbnail = null) {
  const { title, text } = obj;

  const embed = new Discord.RichEmbed()
    .setColor(EmbedConsts.color)
    .addField(title, text);

  if (thumbnail) embed.setThumbnail(thumbnail);

  return embed;
}

function startGameEmbed() {
  return gameEmbed(
    {
      title: '⚔️ **DRAGON SWORD** ⚔️',
      text:
        '_Ruin has come to these lands, once opulent and imperial. First the Fall, then the Taint, and now... this is all that remains; oceans of sun-scorched sand, crooked marshes, the crumbling and decaying husks of bustling towns that bustle no more._\n\n_A half-remembered dream led you to these cursed lands, a dream of the DRAGON SWORD. Shall you be the one to undo what has been done?_'
    },
    'https://i.imgur.com/ASYVh3G.png' // TODO: move this to a constant
  );
}

function characterSheetEmbed(character, charClass, username) {
  return new Discord.RichEmbed()
    .setColor(EmbedConsts.color)
    .setThumbnail(charClass.thumbnail)
    .addField(
      `**${username.toUpperCase()}**`,
      `**Level**: ${getCharacterLevel(character).level}\n**XP:** ${
        character.experience
      }\n**Class:** ${capitalizeFirstLetter(
        charClass.name
      )}\n**Gender:** ${capitalizeFirstLetter(character.pronouns)}`
    )
    .addField(
      '**STATS**',
      `**HP:** ${character.health}\n**MP:** ${character.mana}\n**STR:** ${
        character.str
      }\n**DEF:** ${character.def}\n**AGI:** ${character.agi}\n**LUCK:** ${
        character.luck
      }`
    );
}

function classEmbed(charClass) {
  return new Discord.RichEmbed()
    .setColor(EmbedConsts.color)
    .setThumbnail(charClass.thumbnail)
    .addField(
      `**${capitalizeFirstLetter(charClass.name)}**`,
      `${charClass.description}`
    )
    .addField(
      '**Stats**',
      `HP: ${charClass.base.HP}\nMP: ${charClass.base.MP}\nSTR: ${
        charClass.base.STR
      }\nDEF: ${charClass.base.DEF}\nAGI: ${charClass.base.AGI}\nLUCK: ${
        charClass.base.LUCK
      }`
    );
}

function helpEmbed() {
  return new Discord.RichEmbed()
    .setColor(EmbedConsts.color)
    .setThumbnail('https://i.imgur.com/HGcExwU.png') // TODO: move to constant
    .addField(
      '**Character Creation Help**',
      '`,character help` - displays this message\n`,character list` - lists character classes\n`,character new <class> <pronouns>` - creates new character\n`,character me` - displays your character sheet'
    )
    .addField('**Available pronouns**', 'male, female, neutral');
}

function noCharacterEmbed() {
  return gameEmbed(
    {
      title: '**No character**',
      text:
        'You dont have a character - register with `,character new <className> <pronouns>`'
    },
    'https://i.imgur.com/sn5alk0.png' // TODO: move to constant
  );
}

function alreadyHasCharacterEmbed() {
  return gameEmbed(
    {
      title: '**Character exists**',
      text: 'You already have a character!'
    },
    'https://i.imgur.com/sn5alk0.png' // TODO: move to constant
  );
}

function monsterEmbed(monster, intro) {
  return new Discord.RichEmbed()
    .setThumbnail(monster.thumbnail)
    .setColor(EmbedConsts.color)
    .addField(
      '☠️ **NEW MONSTER** ☠️',
      `**${monster.name}** appeared with **${monster.health} HP**`
    )
    .addBlankField()
    .addField('📕 **NARRATIVE** 📕', intro);
}

function levelUpEmbed(currentLevel, newLevel, stats, username) {
  return gameEmbed(
    {
      title: '**LEVEL UP**',
      text: `**${username}'s** level has increased from **${
        currentLevel.level
      }** to **${newLevel.level}**\n\nHP: **${stats.old.health} -> ${
        stats.new.health
      }**\nMP: **${stats.old.mana} -> ${stats.new.mana}**\nSTR: **${
        stats.old.str
      } -> ${stats.new.str}**\nDEF: **${stats.old.def} -> ${
        stats.new.def
      }**\nAGI: **${stats.old.agi} -> ${stats.new.agi}**\nLUCK: **${
        stats.old.luck
      } -> ${stats.new.luck}**`
    },
    'https://i.imgur.com/LboqQYh.png'
  );
}

function combatEmbed(username, monster, thumbnail) {
  return gameEmbed(
    {
      title: '**COMBAT**',
      text: `**${username}** hit **${monster.name}** for **${
        monster.health
      } HP**, killing it!`
    },
    thumbnail
  );
}

function xpEmbed(username, xp) {
  return gameEmbed(
    {
      title: '**XP SUMMARY**',
      text: `**${username}** gained: **${xp}xp**!`
    },
    'https://i.imgur.com/LboqQYh.png'
  );
}

function combatOutroEmbed(monster) {
  return gameEmbed(
    {
      title: '**NARRATIVE**',
      text: monsterOutro(monster)
    },
    'https://i.imgur.com/IQ4LYIU.png' // TODO: move this into a constant
  );
}

function monsterFailFleeEmbed(name, thumbnail) {
  return gameEmbed(
    {
      title: '**Monster fails to flee**',
      text: `_The ${name} glances away from you, as if vying to escape..._`
    },
    thumbnail
  );
}

function monsterFleeSuccessEmbed(name, thumbnail) {
  return gameEmbed(
    {
      title: '**Monster flees**',
      text: `_The ${name} flees the field of battle as quickly as it came_`
    },
    thumbnail
  );
}

/* === CHARACTER === */
function getCharacterLevel(character) {
  return levels.find((level, index) => {
    if (
      character.experience >= level.threshold &&
      character.experience < levels[index + 1].threshold
    ) {
      return true;
    }
  });
}

function handleLevelUp(character) {
  const charClass = getCharacterClass(character);
  const statObj = {
    old: {
      health: character.health,
      mana: character.mana,
      str: character.str,
      def: character.def,
      agi: character.agi,
      luck: character.luck
    },
    new: {}
  };

  character.health += charClass.growth.HP;
  character.mana += charClass.growth.MP;
  character.str += charClass.growth.STR;
  character.def += charClass.growth.DEF;
  character.agi += charClass.growth.AGI;
  character.luck += charClass.growth.LUCK;

  statObj.new.health = character.health;
  statObj.new.mana = character.mana;
  statObj.new.str = character.str;
  statObj.new.def = character.def;
  statObj.new.agi = character.agi;
  statObj.new.luck = character.luck;

  return statObj;
}

function getCharacterClass(character) {
  const charClass = classes.find(
    charClass => charClass.name === character.class
  );

  if (!charClass) {
    throw new Error('No character class found');
  }

  return charClass;
}

/* === MONSTER NARRATIVE === */
function monsterIntro(monster) {
  // Find a random encounter document
  return Encounter.find()
    .then(encounters => {
      // Replace the monster and description in the encounter doc with the monster name and description
      const encounter = encounters[randomArrayIndex(encounters)].text
        .replace('$MONSTER', monster.name)
        .replace('$DESCRIPTION', monster.description);

      return `_${encounter}_`;
    })
    .catch(err => console.error(err));
}

function monsterOutro(monster) {
  return `_${monster.outro}_`;
}

function monsterFailsToFlee(channel, monster) {
  channel.send(monsterFailFleeEmbed(monster.name, monster.thumbnail));
}

function monsterFlees(channel, gameDoc) {
  channel.send(
    monsterFleeSuccessEmbed(gameDoc.monster.name, gameDoc.monster.thumbnail)
  );

  setGameState(gameDoc, false);
}

module.exports = {
  setGameState,
  gameEmbed,
  getCharacterLevel,
  getCharacterClass,
  handleLevelUp,
  characterSheetEmbed,
  classEmbed,
  helpEmbed,
  monsterEmbed,
  monsterIntro,
  monsterOutro,
  levelUpEmbed,
  xpEmbed,
  combatOutroEmbed,
  combatEmbed,
  startGameEmbed,
  monsterFailFleeEmbed,
  monsterFleeSuccessEmbed,
  monsterFailsToFlee,
  monsterFlees,
  noCharacterEmbed,
  alreadyHasCharacterEmbed
};
