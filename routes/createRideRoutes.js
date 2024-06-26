const express = require('express');
const router = express.Router();
const createRideController = require('../controllers/createRideController');

router.post('/searchUser', createRideController.searchUsers);
router.post('/getVehiclePrice', createRideController.getVehiclePrice);
router.post('/saveRide', createRideController.saveRide);
router.post('/checkPoint', createRideController.checkPoint);

module.exports = router;