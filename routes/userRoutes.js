const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const userProfilePic = require('../middleware/userProfilePic');

router.post('/add', userProfilePic, UserController.createUser);
router.get('/get', userProfilePic, UserController.getUser);
router.get('/getShort', userProfilePic, UserController.getShortUser);
router.delete('/delete/:id', userProfilePic, UserController.deleteUser);
router.put('/edit/:id', userProfilePic, UserController.updateUser);
router.get('/search', UserController.searchUsers);

// payment card
router.post('/add-card',UserController.addCard);
router.get('/cards/:customerId',UserController.getCustomerCards)
router.post('/cards/set-default', UserController.setDefaultCard);
router.delete('/:customerId/cards/:cardId', UserController.deleteCard);


module.exports = router;
