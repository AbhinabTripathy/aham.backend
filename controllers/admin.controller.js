const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { GraphicNovel, Episode, Audiobook, AudiobookEpisode, Creator } = require('../models');
const { Op } = require('sequelize');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');
const fs = require('fs');
const path = require('path');

const adminController = {};

// Admin credentials (hardcoded as specified)
const ADMIN_USERNAME = 'AhamCore';
const ADMIN_PASSWORD = 'Admin@123';

// Admin login
adminController.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate required fields
        if (!username || !password) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                false,
                "Username and password are required"
            );
        }

        // Check if credentials match the hardcoded admin credentials
        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            return res.error(
                HttpStatus.UNAUTHORIZED,
                false,
                "Invalid username or password"
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: 'admin', 
                username: ADMIN_USERNAME,
                role: 'admin'
            },
            process.env.APP_SUPER_SECRET_KEY,
            { expiresIn: '24h' }
        );

        return res.success(
            HttpStatus.OK,
            true,
            "Admin login successful",
            { 
                admin: {
                    username: ADMIN_USERNAME,
                    role: 'admin'
                },
                token
            }
        );

    } catch (error) {
        console.error('Admin login error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error during login",
            error
        );
    }
};

// Get all graphic novels (for admin)
adminController.getAllGraphicNovels = async (req, res) => {
    try {
        const graphicNovels = await GraphicNovel.findAll({
            include: [
                {
                    model: Episode,
                    attributes: ['id', 'episodeNumber', 'iconPath', 'pdfPath', 'createdAt']
                },
                {
                    model: Creator,
                    attributes: ['id', 'username', 'email', 'phoneNumber']
                }
            ],
            order: [['createdAt', 'DESC'], [Episode, 'episodeNumber', 'ASC']]
        });

        return res.success(
            HttpStatus.OK,
            true,
            ResponseMessages.FETCH,
            { graphicNovels }
        );

    } catch (error) {
        console.error('Fetch graphic novels error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error fetching graphic novels",
            error
        );
    }
};

// Get a specific graphic novel with its episodes (for admin)
adminController.getGraphicNovelDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const graphicNovel = await GraphicNovel.findOne({
            where: { id },
            include: [
                {
                    model: Episode,
                    attributes: ['id', 'episodeNumber', 'iconPath', 'pdfPath', 'createdAt']
                },
                {
                    model: Creator,
                    attributes: ['id', 'username', 'email', 'phoneNumber']
                }
            ],
            order: [[Episode, 'episodeNumber', 'ASC']]
        });

        if (!graphicNovel) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Graphic novel not found"
            );
        }

        return res.success(
            HttpStatus.OK,
            true,
            ResponseMessages.FETCH,
            { graphicNovel }
        );

    } catch (error) {
        console.error('Fetch graphic novel details error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error fetching graphic novel details",
            error
        );
    }
};

// Update graphic novel status (for admin)
adminController.updateGraphicNovelStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!status || !['pending', 'published', 'rejected'].includes(status)) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                false,
                "Valid status (pending, published, rejected) is required"
            );
        }

        const graphicNovel = await GraphicNovel.findByPk(id);

        if (!graphicNovel) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Graphic novel not found"
            );
        }

        // Update status
        graphicNovel.status = status;
        await graphicNovel.save();

        return res.success(
            HttpStatus.OK,
            true,
            "Graphic novel status updated successfully",
            { graphicNovel }
        );

    } catch (error) {
        console.error('Update graphic novel status error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error updating graphic novel status",
            error
        );
    }
};

// Create a graphic novel (for admin)
adminController.createGraphicNovel = async (req, res) => {
    try {
        const { title, type } = req.body;
        // Admin ID is automatically assigned from the authenticated user
        const adminId = req.user.id;

        // Validate required fields
        if (!title) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                false,
                "Title is required"
            );
        }

        // Handle novel icon upload
        let novelIcon = null;
        if (req.files && req.files.novelIcon) {
            // Create upload directories if they don't exist
            const uploadsDir = path.join(__dirname, '../uploads');
            const graphicNovelsDir = path.join(uploadsDir, 'graphic-novels');
            const novelsDir = path.join(graphicNovelsDir, 'icons');

            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
            if (!fs.existsSync(graphicNovelsDir)) fs.mkdirSync(graphicNovelsDir);
            if (!fs.existsSync(novelsDir)) fs.mkdirSync(novelsDir);

            const iconFile = req.files.novelIcon;
            const iconFileName = `novel-icon-${Date.now()}${path.extname(iconFile.name)}`;
            novelIcon = `/uploads/graphic-novels/icons/${iconFileName}`;
            
            // Move the file
            await iconFile.mv(path.join(novelsDir, iconFileName));
        }

        // Create new graphic novel
        const newGraphicNovel = await GraphicNovel.create({
            title,
            type,
            novelIcon,
            creatorId: null, // No creator for admin-created content
            adminId, // Set the admin ID from the authenticated user
            role: 'admin', // Set role to admin when created by admin
            status: 'published' // Set status to published by default for admin-created content
        });

        return res.success(
            HttpStatus.CREATED,
            true,
            ResponseMessages.SAVE,
            {
                graphicNovel: newGraphicNovel
            }
        );

    } catch (error) {
        console.error('Graphic novel creation error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error creating graphic novel",
            error
        );
    }
};

// Add an episode to a graphic novel (for admin)
adminController.addEpisodeToGraphicNovel = async (req, res) => {
    try {
        const { graphicNovelId } = req.params;

        // Check if the graphic novel exists
        const graphicNovel = await GraphicNovel.findOne({
            where: { id: graphicNovelId }
        });

        if (!graphicNovel) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Graphic novel not found"
            );
        }

        // Get the next episode number
        const episodeCount = await Episode.count({
            where: { graphicNovelId }
        });
        const episodeNumber = episodeCount + 1;

        // Handle file uploads
        let iconPath = null;
        let pdfPath = null;

        // Create upload directories if they don't exist
        const uploadsDir = path.join(__dirname, '../uploads');
        const graphicNovelsDir = path.join(uploadsDir, 'graphic-novels');
        const novelDir = path.join(graphicNovelsDir, graphicNovelId.toString());
        const episodeDir = path.join(novelDir, episodeNumber.toString());

        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
        if (!fs.existsSync(graphicNovelsDir)) fs.mkdirSync(graphicNovelsDir);
        if (!fs.existsSync(novelDir)) fs.mkdirSync(novelDir);
        if (!fs.existsSync(episodeDir)) fs.mkdirSync(episodeDir);

        // Process icon file if uploaded
        if (req.files && req.files.icon) {
            const iconFile = req.files.icon;
            const iconFileName = `icon-${Date.now()}${path.extname(iconFile.name)}`;
            iconPath = `/uploads/graphic-novels/${graphicNovelId}/${episodeNumber}/${iconFileName}`;
            
            // Move the file
            await iconFile.mv(path.join(episodeDir, iconFileName));
        }

        // Process PDF file if uploaded
        if (req.files && req.files.pdf) {
            const pdfFile = req.files.pdf;
            const pdfFileName = `pdf-${Date.now()}${path.extname(pdfFile.name)}`;
            pdfPath = `/uploads/graphic-novels/${graphicNovelId}/${episodeNumber}/${pdfFileName}`;
            
            // Move the file
            await pdfFile.mv(path.join(episodeDir, pdfFileName));
        }

        // Create new episode
        const newEpisode = await Episode.create({
            graphicNovelId,
            episodeNumber,
            iconPath,
            pdfPath
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

// Get all audiobooks (for admin)
adminController.getAllAudiobooks = async (req, res) => {
    try {
        const audiobooks = await Audiobook.findAll({
            include: [
                {
                    model: AudiobookEpisode,
                    attributes: ['id', 'episodeNumber', 'iconPath', 'youtubeUrl', 'createdAt']
                },
                {
                    model: Creator,
                    attributes: ['id', 'username', 'email', 'phoneNumber']
                }
            ],
            order: [['createdAt', 'DESC'], [AudiobookEpisode, 'episodeNumber', 'ASC']]
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

// Get a specific audiobook with its episodes (for admin)
adminController.getAudiobookDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const audiobook = await Audiobook.findOne({
            where: { id },
            include: [
                {
                    model: AudiobookEpisode,
                    attributes: ['id', 'episodeNumber', 'iconPath', 'youtubeUrl', 'createdAt']
                },
                {
                    model: Creator,
                    attributes: ['id', 'username', 'email', 'phoneNumber']
                }
            ],
            order: [[AudiobookEpisode, 'episodeNumber', 'ASC']]
        });

        if (!audiobook) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Audiobook not found"
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

// Update audiobook status (for admin)
adminController.updateAudiobookStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!status || !['pending', 'published', 'rejected'].includes(status)) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                false,
                "Valid status (pending, published, rejected) is required"
            );
        }

        const audiobook = await Audiobook.findByPk(id);

        if (!audiobook) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Audiobook not found"
            );
        }

        // Update status
        audiobook.status = status;
        await audiobook.save();

        return res.success(
            HttpStatus.OK,
            true,
            "Audiobook status updated successfully",
            { audiobook }
        );

    } catch (error) {
        console.error('Update audiobook status error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error updating audiobook status",
            error
        );
    }
};

// Create an audiobook (for admin)
adminController.createAudiobook = async (req, res) => {
    try {
        const { title } = req.body;
        // Admin ID is automatically assigned from the authenticated user
        const adminId = req.user.id;

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
            creatorId: null, // No creator for admin-created content
            adminId, // Set the admin ID from the authenticated user
            role: 'admin', // Set role to admin when created by admin
            status: 'published' // Set status to published by default for admin-created content
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

// Add an episode to an audiobook (for admin)
adminController.addEpisodeToAudiobook = async (req, res) => {
    try {
        const { audiobookId } = req.params;
        const { youtubeUrl } = req.body;

        // Check if the audiobook exists
        const audiobook = await Audiobook.findOne({
            where: { id: audiobookId }
        });

        if (!audiobook) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Audiobook not found"
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

// Get all creators (for admin)
adminController.getAllCreators = async (req, res) => {
    try {
        const creators = await Creator.findAll({
            attributes: ['id', 'username', 'email', 'phoneNumber', 'status', 'createdAt', 'updatedAt']
        });

        return res.success(
            HttpStatus.OK,
            true,
            ResponseMessages.FETCH,
            { creators }
        );

    } catch (error) {
        console.error('Fetch creators error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error fetching creators",
            error
        );
    }
};

// Update creator status (for admin)
adminController.updateCreatorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                false,
                "Valid status (active, inactive, suspended) is required"
            );
        }

        const creator = await Creator.findByPk(id);

        if (!creator) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Creator not found"
            );
        }

        // Update status
        creator.status = status;
        await creator.save();

        return res.success(
            HttpStatus.OK,
            true,
            "Creator status updated successfully",
            { creator }
        );

    } catch (error) {
        console.error('Update creator status error:', error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            "Error updating creator status",
            error
        );
    }
};

module.exports = adminController;