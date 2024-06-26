

const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');

// Route to create a new zone
router.post('/save', settingController.saveSetting);
router.get('/get', settingController.getSetting);


module.exports = router;