const SaveRideModel = require('../models/createRide');
const User = require('../models/userModel');
const {mongoose } = require('mongoose');
const Feedback = require('../models/ridehistoryModel');

// first get all ride
exports.getRideList = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    console.log(req.query)
  
    try {
      const result = await SaveRideModel.aggregate([
        {
          $match: {
            ridestatus:{
              $in:[3,7]
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
          },
        },
        {
          $lookup: {
            from: "zones",
            localField: "cityId",
            foreignField: "_id",
            as: "city",
          },
        },
        {
          $unwind: {
            path: "$city",
          },
        },
        {
          $lookup: {
            from: "countries",
            localField: "countryId",
            foreignField: "_id",
            as: "country",
          },
        },
        {
          $unwind: {
            path: "$country",
          },
        },
  
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicleId",
            foreignField: "_id",
            as: "service",
          },
        },
        {
          $unwind: {
            path: "$service",
          },
        },
        {
          $lookup: {
            from: "driver_lists",
            localField: "driverId",
            foreignField: "_id",
            as: "driver",
          },
        },
        {
          $unwind: {
            path: "$driver",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$scheduledDate",
              },
            },
          },
        },
        {
          $facet: {
            metadata: [
              { $count: "total" }
            ],
            data: [
              { $skip: (page - 1) * limit },
              { $limit: limit }
            ]
          }
        },
        {
          $unwind: "$metadata"
        }
      ])
  
      // const totalItems = await SaveRideModel.countDocuments();
      const rideList = result[0].data;
      const totalItems = result[0].metadata.total;
      console.log("totoalItem :",totalItems)
  
      res.status(200).json({ success: true, rideList, totalItems });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };


// search ride


exports.searchRides = async (req, res) => {
  try {
    let page = parseInt(req.body.page) || 1;
    let limit = parseInt(req.body.limit) || 5;
    // console.log(page,limit)

    let search = req.body.searchText;
    let statusSearch = parseInt(req.body.statusSearch, 10);
    let vehicleSearch = req.body.vehicleSearch;
    // let date = req.body.searchDate;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

    console.log(req.body);
    
        const matchStage = {};
        if (search) {
          // var searchObjectId;
    
          // if (search.length == 24) {
          //   searchObjectId = new mongoose.Types.ObjectId(search);
          // }
    
          matchStage.$or = [
            { "user.username": { $regex: new RegExp(search, "i") } },
            { "user.phone": { $regex: new RegExp(search, "i") } },
            { "fromLocation": { $regex: new RegExp(search, "i") } },
            { "toLocation": { $regex: new RegExp(search, "i") } },
            { "uniqueId": { $regex: new RegExp(search, "i") } },
          ];
          
        }
    
        const matchCriteria = [];

        // if (date) {
        //     matchCriteria.push({ date: { $regex: new RegExp(date, "i") }})
        // }
        if (startDate && endDate) {
          matchCriteria.push({
            date: {
              $gte:startDate,
              $lte:endDate
            }
          });
        }
        
        if (statusSearch !== -1) {
          matchCriteria.push({ ridestatus: { $in: [statusSearch] } });
        }else if (statusSearch === -1) {
          matchCriteria.push({ ridestatus: { $in: [3, 7] } });
        }
        
        
        if (vehicleSearch && vehicleSearch.length > 0) {
          matchCriteria.push({ vehicleId: new mongoose.Types.ObjectId(vehicleSearch) });
        }
        
        if (matchCriteria.length === 0) {
          matchCriteria.push({});
        }
        


    const aggregationPipeline = [
   
        {
            $match: {
                ridestatus: {
                    $in: [3, 7]
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
            },
        },
      {
        $unwind: {
          path: "$user",
        },
      },
      {
        $lookup: {
          from: "zones",
          localField: "cityId",
          foreignField: "_id",
          as: "city",
        },
      },
      {
        $unwind: {
          path: "$city",
        },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country",
        },
      },
      {
        $unwind: {
          path: "$country",
        },
      },

      {
        $lookup: {
          from: "vehicles",
          localField: "vehicleId",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $unwind: {
          path: "$service",
        },
      },
      {
        $lookup: {
          from: "driver_lists",
          localField: "driverId",
          foreignField: "_id",
          as: "driver",
        },
      },
      {
        $unwind: {
          path: "$driver",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$scheduledDate",
            },
          },
        },
      },

      {
        $match: {
          $and: [...matchCriteria, matchStage],
        },
      },

    ];

    
    
    const totalItemsResult = await SaveRideModel.aggregate(aggregationPipeline);
    const totalItems = totalItemsResult.length 

    aggregationPipeline.push(
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      }
    );

    const searchResult = await SaveRideModel.aggregate(aggregationPipeline);
    
    res.json({ success: true, result: searchResult, totalItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.feedback = async (req, res) => {
  const rideId=req.body.rideId;
  const rating=req.body.feedback.rating;
  const feedback=req.body.feedback.feedback;
  try {

    const feedbackData = await SaveRideModel.findByIdAndUpdate(
      rideId,
      { feedback: { rating,feedback } },
      { new: true } 
  );
    
    res.json({ success: true, message:"feedback send successfully",feedbackData});
  } catch (error) {
    
  }

}






