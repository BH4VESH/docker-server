const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');

router.get('/get', countryController.getAllCountries);
router.post('/add', countryController.createCountry);

module.exports = router;