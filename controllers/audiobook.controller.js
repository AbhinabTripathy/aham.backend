const { Audiobook, AudiobookEpisode } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');
const fs = require('fs');
const path = require('path');

const audiobookController = {};

// Create a new audiobook
audiobookController.createAudiobook = async (req, res) => {
    try {
        const { title } = req.body;
        const creatorId = req.user.id; 

        // Validate required fields
        if (!title) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                false,
                "Title is required"
            );
        }

        // Handle book icon upload
        let bookIcon = null;
        if (req.files && req.files.bookIcon) {
            // Create upload directories if they don't exist
            const uploadsDir = path.join(__dirname, '../uploads');
            const audiobooksDir = path.join(uploadsDir, 'audiobooks');
            const iconsDir = path.join(audiobooksDir, 'icons');

            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
            if (!fs.existsSync(audiobooksDir)) fs.mkdirSync(audiobooksDir);
            if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

            const iconFile = req.files.bookIcon;
            const iconFileName = `book-icon-${Date.now()}${path.extname(iconFile.name)}`;
            bookIcon = `/uploads/audiobooks/icons/${iconFileName}`;
            
            // Move the file
            await iconFile.mv(path.join(iconsDir, iconFileName));
        }

        // Create new audiobook
        const newAudiobook = await Audiobook.create({
            title,
            bookIcon,
            creatorId,
            role: 'creator', // Set role to creator when created by a creator
            status: 'pending' // Set status to pending for admin review
        });

        return res.success(
            HttpStatus.CREATED,
            true,
            ResponseMessages.SAVE,
            {
                audiobook: newAudiobook
            }
        );

    } catch (error) {
        console.error('Audiobook creation error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error creating audiobook",
            error
        );
    }
};

// Add an episode to an audiobook
audiobookController.addEpisode = async (req, res) => {
    try {
        const { audiobookId } = req.params;
        const { youtubeUrl } = req.body;
        const creatorId = req.user.id; 

        // Check if the audiobook exists and belongs to the creator
        const audiobook = await Audiobook.findOne({
            where: { 
                id: audiobookId,
                creatorId
            }
        });

        if (!audiobook) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Audiobook not found or you don't have permission"
            );
        }

        // Get the next episode number
        const episodeCount = await AudiobookEpisode.count({
            where: { audiobookId }
        });
        const episodeNumber = episodeCount + 1;

        // Handle file uploads
        let iconPath = null;

        // Create upload directories if they don't exist
        const uploadsDir = path.join(__dirname, '../uploads');
        const audiobooksDir = path.join(uploadsDir, 'audiobooks');
        const bookDir = path.join(audiobooksDir, audiobookId.toString());
        const episodeDir = path.join(bookDir, episodeNumber.toString());

        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
        if (!fs.existsSync(audiobooksDir)) fs.mkdirSync(audiobooksDir);
        if (!fs.existsSync(bookDir)) fs.mkdirSync(bookDir);
        if (!fs.existsSync(episodeDir)) fs.mkdirSync(episodeDir);

        // Process icon file if uploaded
        if (req.files && req.files.icon) {
            const iconFile = req.files.icon;
            const iconFileName = `icon-${Date.now()}${path.extname(iconFile.name)}`;
            iconPath = `/uploads/audiobooks/${audiobookId}/${episodeNumber}/${iconFileName}`;
            
            // Move the file
            await iconFile.mv(path.join(episodeDir, iconFileName));
        }

        // Create new episode
        const newEpisode = await AudiobookEpisode.create({
            audiobookId,
            episodeNumber,
            iconPath,
            youtubeUrl
        });

        return res.success(
            HttpStatus.CREATED,
            true,
            ResponseMessages.SAVE,
            {
                episode: newEpisode
            }
        );

    } catch (error) {
        console.error('Episode creation error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error adding episode",
            error
        );
    }
};

// Get all audiobooks for a creator
audiobookController.getCreatorAudiobooks = async (req, res) => {
    try {
        const creatorId = req.user.id;

        const audiobooks = await Audiobook.findAll({
            where: { creatorId },
            attributes: ['id', 'title', 'bookIcon', 'creatorId', 'status', 'createdAt', 'updatedAt'],
            include: [{
                model: AudiobookEpisode,
                as:'episodes',
                attributes: ['id', 'episodeNumber', 'iconPath', 'youtubeUrl', 'createdAt']
            }],
            order: [
                [{ model: AudiobookEpisode, as: 'episodes' }, 'createdAt', 'DESC'],
                [{ model: AudiobookEpisode, as: 'episodes' }, 'episodeNumber', 'ASC']

            ]
        });

        return res.success(
            HttpStatus.OK,
            true,
            ResponseMessages.FETCH,
            { audiobooks }
        );

    } catch (error) {
        console.error('Fetch audiobooks error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error fetching audiobooks",
            error
        );
    }
};

// Get a specific audiobook with its episodes
audiobookController.getAudiobookDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const creatorId = req.user.id;

        const audiobook = await Audiobook.findOne({
            where: { 
                id,
                creatorId
            },
            attributes: ['id', 'title', 'bookIcon', 'creatorId', 'status', 'createdAt', 'updatedAt'],
            include: [{
                model: AudiobookEpisode,
                 as:'episodes',
                attributes: ['id', 'episodeNumber', 'iconPath', 'youtubeUrl', 'createdAt']
            }],
            order: [
                [{ model: AudiobookEpisode, as: 'episodes' }, 'createdAt', 'DESC']
            ]
        });

        if (!audiobook) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Audiobook not found or you don't have permission"
            );
        }

        return res.success(
            HttpStatus.OK,
            true,
            ResponseMessages.FETCH,
            { audiobook }
        );

    } catch (error) {
        console.error('Fetch audiobook details error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error fetching audiobook details",
            error
        );
    }
};

// Get a specific episode of a specific audiobook
audiobookController.getAudiobookEpisodeById = async (req, res) => {
    try {
        const { audiobookId, episodeId } = req.params;

        const episode = await AudiobookEpisode.findOne({
            where: {
                id: episodeId,
                audiobookId: audiobookId
            },
            attributes: ['id', 'episodeNumber', 'iconPath', 'youtubeUrl', 'createdAt', 'audiobookId']
        });

        if (!episode) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Episode not found for the given audiobook"
            );
        }

        return res.success(
            HttpStatus.OK,
            true,
            "Episode fetched successfully",
            { episode }
        );

    } catch (error) {
        console.error('Fetch audiobook episode error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error fetching audiobook episode",
            error
        );
    }
};

module.exports = audiobookController;