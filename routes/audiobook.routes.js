const express = require('express');
const router = express.Router();
const audiobookController = require('../controllers/audiobook.controller');
const authMiddleware = require('../middlewares/auth.middleware');


// Get specific episode of a specific audiobook (public)
router.get('/:audiobookId/episodes/:episodeId', audiobookController.getAudiobookEpisodeById);

router.use(authMiddleware.creatorAuth);

// Create a new audiobook
router.post('/', audiobookController.createAudiobook);

// Get all audiobooks for the logged-in creator
router.get('/', audiobookController.getCreatorAudiobooks);

// Get a specific audiobook with its episodes
router.get('/:id', audiobookController.getAudiobookDetails);

// Add an episode to an audiobook
router.post('/:audiobookId/episodes', audiobookController.addEpisode);

module.exports = router;