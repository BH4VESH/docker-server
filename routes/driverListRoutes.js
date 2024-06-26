const express = require('express');
const router = express.Router();
const driverListController = require('../controllers/driverListController');
const driver_list_profile = require('../middleware/driver_list_profile');

router.post('/add', driver_list_profile, driverListController.createDriver);
router.get('/get', driverListController.getDriver);
router.get('/getShort',driverListController.getShortDriver);
router.delete('/delete/:id', driverListController.deleteDriver);
router.put('/edit/:id', driver_list_profile, driverListController.updateDriver);
router.get('/search', driverListController.searchDriver);
router.put('/service/:id', driverListController.addService);
router.get('/status/:id', driverListController.addStatus);
router.post('/fatchCity', driverListController.fetchCity);
router.post('/addBankAccount', driverListController.addBankAccount);
// router.get('/status', Driver_listController);


module.exports = router;
