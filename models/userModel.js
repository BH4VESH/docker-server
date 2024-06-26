const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  countryId:{type: mongoose.Schema.Types.ObjectId},
  profilePic: String,
  username: { type: String },
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  stripeCustomerId:{ type: String}
});

const User = mongoose.model('User', userSchema);

module.exports = User;