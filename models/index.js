const Creator = require('./creator.model');
const GraphicNovel = require('./graphicNovel.model');
const Episode = require('./episode.model');
const Audiobook = require('./audiobook.model');
const AudiobookEpisode = require('./audiobookEpisode.model');

// Define model associations
Creator.hasMany(GraphicNovel, { foreignKey: 'creatorId', constraints: false });
GraphicNovel.belongsTo(Creator, { foreignKey: 'creatorId', constraints: false });

GraphicNovel.hasMany(Episode, { foreignKey: 'graphicNovelId' });
Episode.belongsTo(GraphicNovel, { foreignKey: 'graphicNovelId' });

// Audiobook associations
Creator.hasMany(Audiobook, { foreignKey: 'creatorId', constraints: false });
Audiobook.belongsTo(Creator, { foreignKey: 'creatorId', constraints: false });

Audiobook.hasMany(AudiobookEpisode, { foreignKey: 'audiobookId' });
AudiobookEpisode.belongsTo(Audiobook, { foreignKey: 'audiobookId' });

module.exports = {
    Creator,
    GraphicNovel,
    Episode,
    Audiobook,
    AudiobookEpisode
};