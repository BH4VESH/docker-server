
const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    countryName: String,
    currency: String,
    country_code: String,
    country_calling_code: String,
    time_zone: String,
    flag: String,
    short_name:String
});

module.exports = mongoose.model('Country', countrySchema);
