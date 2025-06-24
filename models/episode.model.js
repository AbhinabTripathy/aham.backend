const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Episode = sequelize.define('episode', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    graphicNovelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'graphicNovels',
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
    pdfPath: {
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

module.exports = Episode;