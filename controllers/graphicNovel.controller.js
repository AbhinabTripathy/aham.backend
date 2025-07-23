const { GraphicNovel, GraphicNovelEpisode } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');
const fs = require('fs');
const path = require('path');

const graphicNovelController = {};

// Create a new graphic novel
graphicNovelController.createGraphicNovel = async (req, res) => {
    try {
        const { title, type } = req.body;
        const creatorId = req.user.id; 

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
            creatorId,
            role: 'creator', 
            status: 'pending' // Set status to pending for admin review
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

// Add an episode to a graphic novel
graphicNovelController.addEpisode = async (req, res) => {
    try {
        const { graphicNovelId } = req.params;
        const creatorId = req.user.id; 

        // Check if the graphic novel exists and belongs to the creator
        const graphicNovel = await GraphicNovel.findOne({
            where: { 
                id: graphicNovelId,
                creatorId
            }
        });

        if (!graphicNovel) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Graphic novel not found or you don't have permission"
            );
        }

        // Get the next episode number
        const episodeCount = await GraphicNovelEpisode.count({
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
        const newEpisode = await GraphicNovelEpisode.create({
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

// Get all graphic novels for a creator
graphicNovelController.getCreatorGraphicNovels = async (req, res) => {
    try {
        const creatorId = req.user.id; // Assuming user ID is available from auth middleware

        const graphicNovels = await GraphicNovel.findAll({
            where: { creatorId },
            attributes: ['id', 'title', 'novelIcon', 'creatorId', 'status', 'createdAt', 'updatedAt'],
            include: [{
                model: GraphicNovelEpisode,
                as:'episodes',
                attributes: ['id', 'episodeNumber', 'iconPath', 'pdfPath', 'createdAt']
            }],
            order: [
                [{ model: GraphicNovelEpisode, as: 'episodes' }, 'createdAt', 'DESC'],
                [{ model: GraphicNovelEpisode, as: 'episodes' }, 'episodeNumber', 'ASC']            ]
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

// Get a specific graphic novel with its episodes
graphicNovelController.getGraphicNovelDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const creatorId = req.user.id; // Assuming user ID is available from auth middleware

        const graphicNovel = await GraphicNovel.findOne({
            where: { 
                id,
                creatorId
            },
            include: [{
                model: GraphicNovelEpisode,
                as: 'episodes',
                attributes: ['id', 'episodeNumber', 'iconPath', 'pdfPath', 'createdAt']
            }],
            order: [['episodes', 'episodeNumber', 'ASC']]
        });

        if (!graphicNovel) {
            return res.error(
                HttpStatus.NOT_FOUND,
                false,
                "Graphic novel not found or you don't have permission"
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


// Get a specific episode of a graphic novel by IDs 
graphicNovelController.getGraphicNovelEpisodeById = async (req, res) => {
  try {
    const { novelId, episodeId } = req.params;

    const episode = await GraphicNovelEpisode.findOne({
      where: {
        id: episodeId,
        graphicNovelId: novelId
      },
      attributes: ['id', 'episodeNumber', 'iconPath', 'pdfPath', 'createdAt'],
      include: [{
        model: GraphicNovel,
        as: 'graphicNovel',
        attributes: ['id', 'title']
      }]
    });

    if (!episode) {
      return res.error(
        HttpStatus.NOT_FOUND,
        false,
        "Episode not found"
      );
    }

    return res.success(
      HttpStatus.OK,
      true,
      ResponseMessages.FETCH,
      { episode }
    );

  } catch (error) {
    console.error('Fetch public episode error:', error);
    return res.error(
      HttpStatus.INTERNAL_SERVER_ERROR,
      false,
      "Error fetching episode details",
      error
    );
  }
};


module.exports = graphicNovelController;