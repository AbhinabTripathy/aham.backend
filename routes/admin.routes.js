const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { checkAuth, checkRole, isAdmin } = require('../middlewares/auth.middleware');

// Admin authentication
router.post('/login', adminController.login);

// Graphic Novel routes (admin only)
router.get('/graphic-novels', checkAuth, isAdmin, adminController.getAllGraphicNovels);
router.get('/graphic-novels/:id', checkAuth, isAdmin, adminController.getGraphicNovelDetails);
router.put('/graphic-novels/:id/status', checkAuth, isAdmin, adminController.updateGraphicNovelStatus);
router.post('/graphic-novels', checkAuth, isAdmin, adminController.createGraphicNovel);
router.post('/graphic-novels/:graphicNovelId/episodes', checkAuth, isAdmin, adminController.addEpisodeToGraphicNovel);

// Audiobook routes (admin only)
router.get('/audiobooks', checkAuth, isAdmin, adminController.getAllAudiobooks);
router.get('/audiobooks/:id', checkAuth, isAdmin, adminController.getAudiobookDetails);
router.put('/audiobooks/:id/status', checkAuth, isAdmin, adminController.updateAudiobookStatus);
router.post('/audiobooks', checkAuth, isAdmin, adminController.createAudiobook);
router.post('/audiobooks/:audiobookId/episodes', checkAuth, isAdmin, adminController.addEpisodeToAudiobook);

// Creator management routes (admin only)
router.get('/creators', checkAuth, isAdmin, adminController.getAllCreators);
router.put('/creators/:id/status', checkAuth, isAdmin, adminController.updateCreatorStatus);

module.exports = router;