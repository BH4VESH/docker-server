const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  countryId:{type: mongoose.Schema.Types.ObjectId},
  cityId:{type: mongoose.Schema.Types.ObjectId},
  vehicleId:{type: mongoose.Schema.Types.ObjectId},
  Driver_Profit: Number,
  min_fare: Number,
  Distance_for_base_price: Number,
  Base_price: Number,
  Price_per_Unit_Distance: Number,
  Price_per_Unit_time: Number,
  Max_space: Number
});

module.exports = mongoose.model('vehicle_price', dataSchema);
