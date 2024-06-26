const socketio = require("socket.io");
const mongoose = require("mongoose");
const driverModel=require('../models/driverListModel')
const createrideModel=require('../models/createRide')


async function initializeSocket(server) {

  const io = socketio(server, { cors: { origin: '*' } });

  global.io = io;

  io.on("connection", (socket) => {
    console.log("Socket is Running.....................");

    // notification counter
    socket.on("counterSend", async () => {
      try {
          const result = await createrideModel.aggregate([
              {
                  $group: {
                      _id: null,
                      count: { $sum: "$assigned" }
                  }
              }
          ]);
  
          let counterNew = result.length > 0 ? result[0].count : 0;
  
          io.emit("counterGet", {
              success: true,
              counter: counterNew
          });
      } catch (error) {
          console.error("Error in counterSend event:", error);
          io.emit("counterGet", {
              success: false,
              error: "An error occurred while fetching the counter."
          });
      }
  });
  

    // initializeCronJob();

    

     //------------------- filter driver data (city ,service,status=>true)
     socket.on("showdriverdata", async (data) => {
      // console.log("70",data);

      try {
        const cityId = new mongoose.Types.ObjectId(data.cityId);
        const serviceId = new mongoose.Types.ObjectId(data.serviceId);
        // console.log(data.cityId, serviceId);

        const aggregationPipeline = [
         {
            $lookup: {
              from: "zones",
              localField: "cityId",
              foreignField: "_id",
              as: "city",
            },
          },
          {
            $unwind: "$city",
          },
          {
            $lookup: {
              from: "vehicles",
              localField: "serviceID",
              foreignField: "_id",
              as: "service",
            },
          },
          {
            $unwind: {
              path: "$service",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              cityId: cityId,
              serviceID: serviceId,
              status: true,
              assign: "0",
            },
          },
        ];
        const driverdata = await driverModel
          .aggregate(aggregationPipeline)
          .exec();
        // console.log( "driverdataresponse", driverdata);

        io.emit("availabledriverdata", driverdata, {
          success: true,
          message: "Driver Data Patched in Assign Dialog Box",
          driverdata,
        });
      } catch (error) {
        console.log(error);
        io.emit("availabledriverdata", {
          success: false,
          message: "Driver Data Not Patched in Assign Dialog Box",
          error: error.message,
        });
      }
    });


// ------------------------final assign confirm btn click(in modal)-----------------
    socket.on("AssignedData", async (data) => {
      const driverId = data.driverId;
      const rideId = data.rideId 
      console.log("socket data ...................................:",data);
      try {
        const driver = await driverModel.findByIdAndUpdate(
          driverId,
          { assign: "1" },
          { new: true }
        );

        const updatedRide = await createrideModel.findByIdAndUpdate(
          { _id: rideId },
          {
            $set: { driverId: driverId, ridestatus: 1, assigningTime: Date.now(), nearest: false },
          },
          { new: true }
        );

        const alldata = await createrideModel.aggregate([
          {
            $match: {
              _id: updatedRide._id,
            },
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
        ]);

        console.log("single assign : ",alldata);

        // AssignedDriverData.push(alldata);
        // console.log(AssignedDriverData);

        io.emit("newdata", {
          success: true,
          message: "Driver Assigned Successfully.",
          alldata,
        });
      } catch (error) {
        console.log(error);
        io.emit("newdata", {
          success: false,
          message: "Sorry Driver Not Assigned",
          error: error.message,
        });
      }
    });


     // ------------near driver assign--------------------------------------

    socket.on("nearData", async (data) => {
      const rideId =new mongoose.Types.ObjectId(data.rideId);
      const cityId = new mongoose.Types.ObjectId(data.cityId);
      const serviceID = new mongoose.Types.ObjectId(data.serviceId);
      // console.log("body data :", data);
      const driverdata = await driverModel.find({ status: true, cityId: cityId, serviceID:serviceID, assign: "0" });

        // console.log("near all driver : ",driverdata)

        const firstdriver = driverdata[0]
        // console.log("near firstdriver ",firstdriver.username);

        if (firstdriver) {   
          const driver = await driverModel.findByIdAndUpdate(firstdriver._id, { assign: "1" }, { new: true });
          
          // console.log("first driver detail : ",driver)
          
          const ride = await createrideModel.findByIdAndUpdate(rideId, { driverId: firstdriver._id,
            ridestatus: 1,
            nearest: true,
            nearestArray: firstdriver._id,
            assigningTime: Date.now() },
            { new: true })
            
            // console.log("near update ride :",ride )    
          }
          else{
            const ride = await createrideModel.findByIdAndUpdate(rideId, {
              ridestatus: 1,
              nearest: true, },{ new: true })
          }

      try { 

        const alldata = await createrideModel.aggregate([
          {
            $match: {
              _id: rideId,
            },
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
        ]);

        console.log("near driver assign dara", alldata)

        io.emit("nearResponce", {
          success: true,
          message: "Assign Any Available Driver Success.",
          alldata,
        });
      } catch (error) {
        console.log(error);
        io.emit("nearResponce", {
          success: false,
          message: "Sorry,Not Assign Any Available Driver",
          error: error.message,
        });
      }
    });


    socket.on("disconnect", () => {
      console.log("client Disconnected.....................");
    });
  });


}


module.exports = initializeSocket;
