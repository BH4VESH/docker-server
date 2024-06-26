
const cron = require('node-cron');
const createrideModel = require('../models/createRide');
const driverModel = require('../models/driverListModel');
const Setting =require('../models/settingModel')
const mongoose = require("mongoose");



// const TIMEOUT_DURATION = 10000;

async function fetchSettings() {
    try {
      const settings = await Setting.findOne({});
      if (settings) {
        return settings;
      } 
      
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {
        selectedSeconds: 10,
      };
    }
  }

module.exports = () => {
  
// ------------------cron part-------------------

// const TIMEOUT_DURATION = 10000; // Time duration for each driver assignment


cron.schedule('* * * * * *', async () => {

    console.log("Cron job executing...");

    const settings = await fetchSettings();
    const TIMEOUT_DURATION = settings.selectedSeconds * 1000;


    try {
      console.log('Cron job executed..............................................');

      // -------------------if direct assign driver
      const currentTime = new Date();
      const timeoutTime = new Date(currentTime.getTime() - TIMEOUT_DURATION);
      // const timeoutTime = new Date(currentTime.getTime());

      const requests = await createrideModel.aggregate(
        [{

          $match: {
            ridestatus: 1,
            nearest: false
          }
        },
        ]
      )
      // console.log(requests)
      // console.log(currentTime)
      // console.log(timeoutTime)
      if (requests) {

        for (const request of requests) {

          let assignTime = new Date(request.assigningTime)
          console.log(assignTime)

          if (timeoutTime.getTime() > assignTime.getTime()) {


            console.log(".....................>>>>>>>>>>>>>>............")
            // var ridedata = await createrideModel.findByIdAndUpdate(request._id, { $set: { ridestatus: 0 }, $unset: { driverId: 1 },assigned: "reassign"}, { new: true } );
            var ridedata = await createrideModel.findByIdAndUpdate(request._id, { $set: { ridestatus: 0 }, $unset: { driverId: 1 },assigned:1 }, { new: true } );

            var driverdata = await driverModel.findByIdAndUpdate(request.driverId, { $set: { assign: 0 } }, { new: true });

            // for counter
            var counter=await createrideModel.aggregate(
              [
                {
                  $group: {
                    _id: null,
                    count: {
                      $sum: "$assigned",
                    },
                  },
                },
              ]
            )

            // global.counter++
            console.log("Counterrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr",counter[0].count)
            global.io.emit("cronUpdateData", {
              success: true,
              message: "timeoutdata",
              ridedata,
              driverdata,
              counter:counter[0].count
            });

            // console.log(request.driverId)
            console.log("it is ride data............", ridedata)
            console.log("it is driver data............", driverdata)
           
          }
        }

      }
    } catch (error) {
      console.error('Error in cron job:', error);
    }

    // --------------------near driver find


    try {
      const currentTime = new Date().getTime();
      const timeoutTime = currentTime - TIMEOUT_DURATION;

      const nearRequests = await createrideModel.aggregate([
        {
          $match: {
            $and: [
              { $or: [{ ridestatus: 1 }, { ridestatus: 8 }] },
              { nearest: true },
              {
                $expr: {
                  $lt: [
                    "$assigningTime",
                    timeoutTime
                  ]
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: "driver_lists",
            let: { cityId: "$cityId", vehicleId: "$vehicleId", priAssigneddrivers: "$nearestArray" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$status", true] },
                      { $eq: ["$cityId", "$$cityId"] },
                      { $eq: ["$serviceID", "$$vehicleId"] },
                      { $eq: ["$assign", "0"] },
                      { $not: { $in: ["$_id", "$$priAssigneddrivers"] } }
                    ]
                  }
                }
              }
            ],
            as: "pendingDrivers"
          }
        },

        // total driver
        {
          $lookup: {
            from: "driver_lists",
            let: {
              cityId: "$cityId",
              vehicleId: "$vehicleId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$status", true] },
                      { $eq: ["$cityId", "$$cityId"] },
                      { $eq: ["$serviceID", "$$vehicleId"] },
                      // { $eq: ["$assign", "0"] },
                    ],
                  },
                },
              },
              {
                $count: "totalDrivers",
              },
            ],
            as: "totalDriversArray",
          },
        },
        {
          $unwind: {
            path: "$totalDriversArray",
          }
        },


        {
          $addFields: {
            randomIndex: { $floor: { $multiply: [{ $rand: {} }, { $size: "$pendingDrivers" }] } }
          }
        },
        {
          $addFields: {
            randomDriver: { $arrayElemAt: ["$pendingDrivers", "$randomIndex"] }
          }
        },
        {
          $project: {
            driverdata: {
              $cond: {
                if: {
                  $gt: [
                    { $size: "$pendingDrivers" },
                    0,
                  ],
                },
                then: {
                  $arrayElemAt: [
                    "$pendingDrivers",
                    "$randomIndex",
                  ],
                },
                else: null,
              },
            },

            pendingDrivers: "$pendingDrivers",

            totalDrivers: "$totalDriversArray.totalDrivers",

            totalNear: { $size: "$nearestArray" },

            ridestatus: {
              $cond: {
                if: {
                  $gt: [
                    { $size: "$pendingDrivers" },
                    0,
                  ],
                },

                then: 1,

                else: 2
              }
            }

          },
        },
        {
          $addFields: {
            driverId: "$driverdata._id"
          }
        },
        {
          $addFields: {
            assigningTime: Date.now()
          }
        },
        // ...cronUpdateDataPipe

      ]);
      console.log("--------///////////-----------",)

      // console.log(nearRequests)

      console.log("--------///////////-----------",)

      
      
      if (nearRequests) {
        
        console.log("NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN",nearRequests)
        //  if(nearRequests.length==0)
        //   {
        //     const driverdata= await driverModel.findByIdAndUpdate(data.driverId, { assign: "1" });

        //     // -----------------Update ride

        //    const ridedata= await createrideModel.findByIdAndUpdate(data._id, {
        //       $addToSet: { nearestArray: data.driverId },
        //       assigningTime: data.assigningTime,
        //       driverId: data.driverId,
        //       ridestatus: 1,
        //       // assigned:1
        //     }, { new: true });
        //   }
        
        for (var data of nearRequests) {

          const lastAssignedDriverId = await createrideModel.aggregate([
            {
              $match: {
                $and: [
                  { ridestatus: 1 },
                  { _id: data._id },
                  {
                    $expr: {
                      $lt: ["$assigningTime", timeoutTime]
                    }
                  }
                ]
              }
            },
            { $project: { lastDriverId: { $arrayElemAt: ["$nearestArray", -1] } } },
            
          ]);


          if (data.ridestatus == 1) {

            //------------- Free previous driver 

            if (lastAssignedDriverId.length > 0) {
              await driverModel.findByIdAndUpdate(lastAssignedDriverId[0].lastDriverId, { assign: "0" });
            }

            //----------------- Assign new driver
           const driverdata= await driverModel.findByIdAndUpdate(data.driverId, { assign: "1" });

            // -----------------Update ride

           const ridedata= await createrideModel.findByIdAndUpdate(data._id, {
              $addToSet: { nearestArray: data.driverId },
              assigningTime: data.assigningTime,
              driverId: data.driverId,
              ridestatus: 1,
              // assigned:1
            }, { new: true });

            // /////////////////////////////pipeline timer perpose
            const cronUpdateDataPipe = [
                {
                    $match: {
                        _id:new mongoose.Types.ObjectId(ridedata._id)
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
                        // preserveNullAndEmptyArrays: true,
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
            ]

            // /////////////////////////////pipeline

            const updatedata = await createrideModel.aggregate(cronUpdateDataPipe);

            global.io.emit("cronUpdateData2A", {
              success: true,
              message: "timeoutdata",
              driverdata,
              ridedata,
              updatedata:updatedata[0],
            });
            console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")

          }

          else {

            console.log("299--elae part start--")
            
            if (data.ridestatus == 2) {

              if (data.totalDrivers > data.totalNear) {

                // ---------------------hold condition
                if (lastAssignedDriverId.length > 0) {
                 const driverdata= await driverModel.findByIdAndUpdate(lastAssignedDriverId[0].lastDriverId, { assign: "0" });
                  console.log("mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm")
                  console.log("1025 =>lastAssignedDriverId : ", lastAssignedDriverId)
                }

               const ridedata= await createrideModel.findByIdAndUpdate(data._id, {
                  driverId: null,
                  ridestatus: 8,//hold
                  // assigned: "hold"
                }, { new: true });

                global.io.emit("cronUpdateData2B", {
                  success: true,
                  message: "timeoutdata",
                  driverdata,
                  ridedata
                });
                console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB")

              } else {

                if (lastAssignedDriverId.length > 0) {
                 const driverdata= await driverModel.findByIdAndUpdate(lastAssignedDriverId[0].lastDriverId, { assign: "0" });
                }

               const ridedata= await createrideModel.findByIdAndUpdate(data._id, {
                  nearest: false,
                  nearestArray: [],
                  driverId: null,
                  ridestatus: 0,
                  assigned: 1
                }, { new: true });

                // global.counter++
                var counter=await createrideModel.aggregate(
                  [
                    {
                      $group: {
                        _id: null,
                        count: {
                          $sum: "$assigned",
                        },
                      },
                    },
                  ]
                )

                global.io.emit("cronUpdateData2C", {
                    success: true,
                    message: "timeoutdata",
                    driverdata,
                    ridedata,
                    counter:counter[0].count
                  });

                  console.log("CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC")
              }
            //   global.io.emit("cronUpdateData2", {
            //     success: true,
            //     message: "timeoutdata",
            //     driverdata,
            //     ridedata
            //   });

            }

          }
        }
      } else {
        console.log("....erroe....")
      }

    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });

// ------------------cron part over-------------------

    
};
