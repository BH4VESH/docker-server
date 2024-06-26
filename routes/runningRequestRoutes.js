const express = require('express');
const router = express.Router();
const runningRequestController = require('../controllers/runningRequestController');
const userProfilePic = require('../middleware/userProfilePic');

router.get('/getRunningData', runningRequestController.getRunningData);
router.post('/rejectRide', runningRequestController.rejectRide);
router.post('/acceptRide', runningRequestController.acceptRide);
router.post('/arriveRide', runningRequestController.arriveRide);
router.post('/pickRide', runningRequestController.pickRide);
router.post('/startRide', runningRequestController.startRide);
router.post('/completeRide', runningRequestController.completeRide);
router.post('/freerideanddriver', runningRequestController.freerideanddriver);


module.exports = router;