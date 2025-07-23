const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GraphicNovel = sequelize.define('graphicNovel', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
   
    novelIcon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    creatorId: {
        type: DataTypes.INTEGER,
        allowNull: true
        
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



module.exports = GraphicNovel;