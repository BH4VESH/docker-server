const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);


const saveRideSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId},
    countryId:{type: mongoose.Schema.Types.ObjectId},
    cityId: {type: mongoose.Schema.Types.ObjectId},
    vehicleId: {type: mongoose.Schema.Types.ObjectId},
    driverId: {type: mongoose.Schema.Types.ObjectId,},
    totalDistanceKm: Number,
    totalDurationMin: Number,
    fromLocation: String,
    toLocation: String,
    stopValue: [String],
    estimeteFare: Number,
    paymentOption: String,
    bookingOption: String,
    scheduledDate: Date, 
    scheduledTimeSeconds: Number,
    uniqueId: { type: String, unique: true },
      ridestatus: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        default: 0,
      },
      assigningTime: {
        type: Number
      },
      
      nearest: {
        type: Boolean,
        default: false,
      }, 
      nearestArray: {
        type: Array
      },
      feedback:{
        type:{
          rating:Number,
          feedback:String
        },
        default:null
        },
        assigned:{
          // type:String,
          type:Number,
          default:null
       }
},
{
  timestamps: true,
},

);

saveRideSchema.pre('save', async function(next) {
  const doc = this;
  try {
    if (doc.isNew) {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'rideId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      doc.uniqueId = counter.seq;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('SaveRide', saveRideSchema);


