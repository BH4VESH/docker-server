const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/cityController');

// Route to create a new zone
router.post('/add', zoneController.createZone);
router.get('/get', zoneController.getAllZones);
router.put('/update/:id', zoneController.updateZone);

module.exports = router;
