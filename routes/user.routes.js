const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.post('/register', userController.register);
router.post('/login',userController.login);
router.get('/published-content', userController.getPublishedContent);
router.get('/graphic-novels', userController.getPublishedGraphicNovels);
router.get('/audiobooks', userController.getPublishedAudiobooks);



module.exports = router;
