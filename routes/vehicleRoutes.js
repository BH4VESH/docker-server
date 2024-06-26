// src/routes/vehicleRoutes.js

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const fileUploadMiddleware = require('../middleware/fileUpload');

router.post('/add', fileUploadMiddleware, vehicleController.addVehicle);
router.get('/list', vehicleController.getVehicles);
router.put('/edit/:id', fileUploadMiddleware,vehicleController.editVehicle);

module.exports = router;
