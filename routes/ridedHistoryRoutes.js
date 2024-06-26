const express = require('express');
const router = express.Router();
const rideHistoryController = require('../controllers/rideHistoryController');
const userProfilePic = require('../middleware/userProfilePic');

router.get('/getRideList', rideHistoryController.getRideList);
router.post('/search', rideHistoryController.searchRides);
router.post('/feedback', rideHistoryController.feedback);

module.exports = router;