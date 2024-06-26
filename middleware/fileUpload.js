// src/middleware/fileUpload.js

const multer = require('multer');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/icons');
    },
    filename: function (req, file, cb) {
        const originalName = file.originalname.split('.')[0];
        cb(null,  Date.now()+ '-' + originalName + '.' + file.originalname.split('.')[1]);
    }
});

// File upload filter
const fileFilter = (req, file, cb) => {
    // Validate file type
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed'), false);
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload.single('icon');
