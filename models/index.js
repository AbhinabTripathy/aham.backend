const Creator = require('./creator.model');
const GraphicNovel = require('./graphicNovel.model');
const GraphicNovelEpisode = require('./graphicNovelEpisode.model');
const Audiobook = require('./audiobook.model');
const AudiobookEpisode = require('./audiobookEpisode.model');
const User = require('./user.model');

// Creator to Graphic Novel
Creator.hasMany(GraphicNovel, { foreignKey: 'creatorId', constraints: false });
GraphicNovel.belongsTo(Creator, { foreignKey: 'creatorId', constraints: false });

// Graphic Novel to Episodes
GraphicNovel.hasMany(GraphicNovelEpisode, { foreignKey: 'graphicNovelId', as: 'episodes' });
GraphicNovelEpisode.belongsTo(GraphicNovel, { foreignKey: 'graphicNovelId', as: 'graphicNovel' });

// Creator to Audiobook
Creator.hasMany(Audiobook, { foreignKey: 'creatorId', constraints: false });
Audiobook.belongsTo(Creator, { foreignKey: 'creatorId', constraints: false });

// Audiobook to Audiobook Episodes
Audiobook.hasMany(AudiobookEpisode, { foreignKey: 'audiobookId', as: 'episodes' });
AudiobookEpisode.belongsTo(Audiobook, { foreignKey: 'audiobookId', as: 'audiobook' });

module.exports = {
  Creator,
  GraphicNovel,
  GraphicNovelEpisode,
  Audiobook,
  AudiobookEpisode,
  User
};
