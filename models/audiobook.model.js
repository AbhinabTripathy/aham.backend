const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Audiobook = sequelize.define('audiobook', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bookIcon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    creatorId: {
        type: DataTypes.INTEGER,
        allowNull: true
        // Removed foreign key constraint to allow null values
    },
    adminId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('admin', 'creator'),
        defaultValue: 'creator'
    },
    status: {
        type: DataTypes.ENUM('pending', 'published', 'rejected'),
        defaultValue: 'pending'
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

module.exports = Audiobook;