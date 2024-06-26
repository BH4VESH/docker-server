const express = require('express');
const router = express.Router();
const confirmedRideController = require('../controllers/confirmedRideController');
const userProfilePic = require('../middleware/userProfilePic');

router.get('/getRideList', confirmedRideController.getRideList);
router.post('/search', confirmedRideController.searchRides);
router.post('/delete', confirmedRideController.delete);

module.exports = router;