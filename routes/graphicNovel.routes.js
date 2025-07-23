const express = require('express');
const router = express.Router();
const graphicNovelController = require('../controllers/graphicNovel.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkAuth } = require('../middlewares/auth.middleware');


//get episode by a specific graphic novel
router.get('/:novelId/episodes/:episodeId', graphicNovelController.getGraphicNovelEpisodeById);

// Apply creator auth middleware to all routes
router.use(authMiddleware.creatorAuth);

// Create a new graphic novel
router.post('/', graphicNovelController.createGraphicNovel);
/// Get all graphic novels for the logged-in creator
router.get('/', graphicNovelController.getCreatorGraphicNovels);

// Get a specific graphic novel with its episodes
router.get('/:id', graphicNovelController.getGraphicNovelDetails);

// Add an episode to a graphic novel
router.post('/:graphicNovelId/episodes', graphicNovelController.addEpisode);


module.exports = router;