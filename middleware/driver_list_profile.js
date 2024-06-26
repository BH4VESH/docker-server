// src/middleware/fileUpload.js

const multer = require('multer');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/driver_list_profile');
    },
    filename: function (req, file, cb) {
        const originalName = file.originalname.split('.')[0];
        cb(null,  Date.now()+ '-' + originalName + '.' + file.originalname.split('.')[1]);
    }
});



const upload = multer({ storage });

module.exports = upload.single('profilePic');
