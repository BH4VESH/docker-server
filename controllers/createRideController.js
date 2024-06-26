const User = require('../models/userModel');
const Zone =require('../models/cityModel')
const {mongoose } = require('mongoose');
const SaveRideModel = require('../models/createRide');
const dotenv=require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SK);
const turf = require('@turf/turf');

exports.searchUsers = async (req, res) => {
    const { countryId, phone } = req.body;
    try {
        const users = await User.aggregate([
            {
                $match: {
                    $and: [
                        { countryId: new mongoose.Types.ObjectId(countryId) },
                        { phone: { $regex: phone, $options: 'i' } }
                    ]
                }
            },
            {
                $lookup: {
                  from: "zones",
                  localField: "countryId",
                  foreignField: "country_id",
                  as: "city",
                },
              },
              {
                $unwind: {
                  path: "$city",
                  preserveNullAndEmptyArrays: true
                },
              },
        ]);
            
              const customer = await stripe.customers.retrieve(users[0].stripeCustomerId);
              const cards = await stripe.customers.listSources(users[0].stripeCustomerId, { object: 'card' });
              const defaultCardId = customer.default_source;
            
        if (users.length > 0) {
            console.log(cards.data)
            res.json({ success: true, users, message: 'Users found success' ,users,cards: cards.data, defaultCardId: defaultCardId});
        } else {
            res.json({ success: false, message: 'No users found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// get vehicle price by specific selected city
exports.getVehiclePrice=async (req,res)=>{
    try{
        const { zoneCityId }=req.body;
        const vehicleData=await Zone.aggregate(
            [
                {
                  $match: {
                    _id: new mongoose.Types.ObjectId(zoneCityId)
                  }
                },
                {
                  $lookup: {
                    from: "vehicle_prices",
                    let: { cityId: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ["$cityId", "$$cityId"] }
                        },
              
                      },
                      
                    ],
                    as: "vehicle_price"
                  },
                  
                },
                  {
                    $unwind: {
                      path: "$vehicle_price",
                  
                    }
                  },
                        // add vehicele
                {
                  $lookup: {
                    from: "vehicles",
                       let: { cityId: "$vehicle_price.vehicleId" },
                    pipeline:[
                      {
                        $match:{
                          $expr:{$eq:["$_id","$$cityId"]}
                        }
                      }
                    ],
                      
                    as: "vehicle"
                  }
                },
                {
                  $unwind: {
                    path: "$vehicle",
                  }
                }          
                
              ]     
        )
        // console.log(vehicleData)
        res.json({ success: true, message: 'Vehicle Price found success',vehicleData});
    }catch{

    }  
}

// saveRide
exports.saveRide = async (req, res) => {
    try {
        const rideData = req.body;
        const ride = new SaveRideModel(rideData);
        await ride.save();
        res.json({ success: true, message: 'Ride saved successfully', ride });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    
};


exports.checkPoint = async (req, res) => {
  console.log("Request Body:", req.body);
  const countryId = req.body.countryId;
  const checkPoint = req.body.checkPoint;

  // console.log("cccccccccccc",checkPoint.lat)

  const point = {
    type: 'Point',
    coordinates: [70.839302, 22.339008]// Coordinates of the point
  };

  try {
    
    const result = await Zone.aggregate([
      {
        $match: {
          country_id: new mongoose.Types.ObjectId(countryId)
        }
      },
      {
        $match: {
          coordinates: {
            $geoIntersects: {
              $geometry: {
                  type: 'Point',
                  coordinates: [checkPoint.lng,checkPoint.lat]
              }
          }
          }
        }
      }
    ]);
    
    if (result.length > 0) {
      res.json({success:true,message:'Point is inside a polygon',inside:true,result})
      console.log('Point is inside a polygon');
    } else {
      res.json({success:true,message:'Point is outside all polygons',inside:false})
      console.log('Point is outside all polygons');
    }

  
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  


};
