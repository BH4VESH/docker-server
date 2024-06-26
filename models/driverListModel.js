const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  countryId:{type: mongoose.Schema.Types.ObjectId},
  cityId:{type: mongoose.Schema.Types.ObjectId},
  serviceID:{type: mongoose.Schema.Types.ObjectId},
  profilePic: String,
  username: { type: String },
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  status:{type:Boolean,default: false},
  assign: {type: String,default: "0"},
  stripeDriverId:{ type: String}
});

const Driver = mongoose.model('Driver_list', userSchema);

module.exports =Driver;