const express = require('express');
const router = express.Router();
const vehicle_priceController = require('../controllers/vehiclePriceController');


router.get('/get', vehicle_priceController.getData);
router.post('/add', vehicle_priceController.createData);
router.put('/edit/:id', vehicle_priceController.updatePrice);

module.exports = router;
