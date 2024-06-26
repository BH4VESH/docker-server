const fs = require('fs');
const path = require('path');

function deleteImage(imagePath) {
    try {
        const absoluteImagePath = path.join(__dirname, imagePath);
        fs.unlinkSync(absoluteImagePath);
        console.log('Image deleted successfully.');
    } catch (err) {
        console.error('Error deleting image:', err);
    }
}

module.exports = deleteImage;