const mongoose = require('mongoose');

const rideHistory= new mongoose.Schema({
    rideId:{ type: String, required: true },
    rating:{ type: String, required: true },
    feedback:{ type: String, required: true },
    submited:{type:Boolean,default:true}
});

module.exports = mongoose.model('feedback', rideHistory);