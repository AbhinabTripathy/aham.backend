const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creator.controller');


router.post('/register', creatorController.register);
router.post('/login', creatorController.login);

module.exports = router;