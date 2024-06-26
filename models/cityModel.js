// const mongoose = require('mongoose');

// const zoneSchema = new mongoose.Schema({

//   country_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
//   name: { type: String, required: true },
//   coordinates: [{ lat: Number, lng: Number }]
// });

// module.exports = mongoose.model('Zone', zoneSchema);


  const mongoose = require('mongoose');

  const zoneSchema = new mongoose.Schema({
    country_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
    name: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Polygon'],default:'Polygon' },
      coordinates: { type: [[[Number]]], required: true }
    }
  });

  // Create the geospatial index
  zoneSchema.index({ coordinates: '2dsphere' });

  module.exports = mongoose.model('Zone', zoneSchema);
