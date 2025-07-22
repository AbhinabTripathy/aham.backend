const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AudiobookEpisode = sequelize.define('audiobookEpisode', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    audiobookId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'audiobooks',
            key: 'id'
        }
    },
    episodeNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    iconPath: {
        type: DataTypes.STRING,
        allowNull: true
    },
    youtubeUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});



module.exports = AudiobookEpisode;