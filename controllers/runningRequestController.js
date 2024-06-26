const createrideModel = require('../models/createRide');
const driverModel = require('../models/driverListModel');
const userModel = require('../models/userModel');
const { mongoose } = require('mongoose');
const { chargeCustomer } = require('../service/payment');
const { sms } = require('../service/sms');
const { mail } = require('../service/mail');


// ------------------------get ride
exports.getRunningData = async (req, res) => {
  try {
    const alldata = await createrideModel.aggregate([
      {
        $match: {
          ridestatus: { $in: [1, 4, 5, 6, 7, 8, 9] },
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

    // console.log(alldata);

    io.emit("runningdata", {
      success: true,
      message: "Running-Request Data",
      alldata,
    });
    res.json({ success: true, message: "Running-Request Data",alldata });
  } catch (error) {
    console.error(error);
    io.emit("runningdata", {
      success: false,
      message: "Error retrieving data",
      error: error.message,
    });
    res.json({ success: false,
      message: "Error retrieving data",
      error: error.message,});
  }

}
// ------------------------reject ride

exports.rejectRide = async (req, res) => {
  const rideId = req.body.rideId
  const driverId = req.body.driverId


  try {
    const fetchridedata = await createrideModel.findById(rideId);
    console.log("fetchridedata : ",fetchridedata);

    const nearestfalsedriver = await driverModel.findByIdAndUpdate(
      { _id: driverId },
      { $set: { assign: "0" } }, { new: true }
    );

    let nearestfalseride;
    // console.log(fetchridedata.nearest);

    if (fetchridedata.nearest == false) {
      nearestfalseride = await createrideModel.findByIdAndUpdate(rideId,
        { $unset: { driverId: "", assigningTime: "", nearestArray: "" }, $set: { ridestatus: 2 } }, { new: true }
      );
      global.io.emit('assignrejected', nearestfalseride, nearestfalsedriver)
      res.json({ success: true,nearestfalseride, nearestfalsedriver });
      // console.log("ffffffffffaaaaaaaaa" , nearestfalseride);
    } else {

      let driverData = await driverModel.aggregate([
        {
          $match: {
            status: true,
            cityId: fetchridedata.cityId,
            serviceID: fetchridedata.vehicleId,
            assign: "0",
            _id: { $nin: fetchridedata.nearestArray }
          },
        },
      ]);

      if (driverData.length > 0) {

        const newdriver = await driverModel.findByIdAndUpdate(driverData[0]._id, { $set: { assign: "1" } }, { new: true });
        // console.log("nnnnnnnnnn", newdriver);


        const result = await createrideModel.findByIdAndUpdate(rideId,
          {
            $set: {
              assigningTime: Date.now(),
              driverId: driverData[0]._id
            },
            $addToSet: { nearestArray: driverData[0]._id }
          },
          { new: true }
        );

        global.io.emit('runningrequestreject', result)
        res.json({ success: true,result });

      } else {
        // console.log("hhhhhhhhhhh" , "Else");
        //hold condition
        let assigneddriverdata = await driverModel.aggregate([
          {
            $match: {
              status: true,
              cityId: fetchridedata.cityId,
              serviceID: fetchridedata.vehicleId,
              assign: "1",
              _id: { $nin: fetchridedata.nearestArray }
            },
          },
        ]);

        const result = await createrideModel.findByIdAndUpdate(rideId, { $set: { assigningTime: Date.now(), ridestatus: 8 }, $unset: { driverId: "" } }, { new: true });
        global.io.emit('runningrequestreject', result)
        res.json({ success: true,result });

      }

    }

  } catch (error) {
    console.error(error);
  }
};


//-------------------------accepted
exports.acceptRide = async (req, res) => {
  const driverId = req.body.driverId
  const rideId = req.body.rideId;

  try {
    const ride = await createrideModel.findByIdAndUpdate(rideId, { driverId: driverId, ridestatus: 4 ,assigned:0}, { new: true })

    // const driver = await driverModel.findByIdAndUpdate(driverId, { $set: { assign: "1" } }, { new: true });

    var counter = await createrideModel.aggregate(
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
    // var counter2 = counter[0].count
    // if (counter2 <= 0) {
    //   counter2 = 0
    // } else {
    //   // global.counter--
    //   counter2 = counter[0].count
    // }
              
    // ride.counter = counter2;

    await sms('ride accepted')
    global.io.emit('rideupdates', { ride, counter2:counter[0].count });
    res.json({ success: true, ride, counter2:counter[0].count });

  } catch (error) {
    console.log(error);
  }
};

exports.arriveRide = async (req, res) => {
  const rideId = req.body.rideId
  try {
    const ride = await createrideModel.findByIdAndUpdate(rideId, { ridestatus: 5 }, { new: true })

    // var counter2 = global.counter
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
    global.io.emit('rideupdates', { ride, counter2:counter[0].count });
    res.json({ success: true, ride, counter2:counter[0].count });
  } catch (error) {
    console.log(error);
  }
};
exports.pickRide = async (req, res) => {
  const rideId = req.body.rideId
  try {
    const ride = await createrideModel.findByIdAndUpdate(rideId, { ridestatus: 9 }, { new: true })

    // var counter2 = global.counter
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
    global.io.emit('rideupdates', { ride, counter2:counter[0].count });
    res.json({ success: true, ride, counter2:counter[0].count });
  } catch (error) {
    console.log(error);
  }
};
exports.startRide = async (req, res) => {
  const rideId = req.body.rideId
  try {
    const ride = await createrideModel.findByIdAndUpdate(rideId, { ridestatus: 6 }, { new: true })

    // var counter2 = global.counter
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
    await sms('ride stared')
    global.io.emit('rideupdates', { ride, counter2:counter[0].count });
    res.json({ success: true, ride, counter2:counter[0].count });
  } catch (error) {
    console.log(error);
  }
};
exports.completeRide = async (req, res) => {
  const rideId = req.body.rideId
  const driverId = req.body.driverId

  try {
    const driver = await driverModel.findById(driverId)
    const driverAcc = driver.stripeDriverId
    // const ride = await createrideModel.findByIdAndUpdate(rideId, { $set: { ridestatus: 0 }},{ new: true } );
    const ride = await createrideModel.findByIdAndUpdate(rideId, { $set: { ridestatus: 7 } }, { new: true });
    const user = await userModel.findById(ride.userId)

    // for the payment
    const { success, message, clientSecret, auth_redirectUrl, paymentIntentStatus } = await chargeCustomer(user.stripeCustomerId, ride.estimeteFare, driverAcc, ride);

    console.log("AAAAAA", success)
    console.log("BBBBBB", message)
    console.log("CCCCCC", driver)
    console.log("DDDDDD", auth_redirectUrl)

    // var counter2 = global.counter
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
    await sms('ride completed')
    global.io.emit("rideupdates", { success, ride, driver, counter2:counter[0].count, message, auth_redirectUrl });
    res.json({ success: true, ride, driver, message, counter2:counter[0].count, auth_redirectUrl });

  } catch (error) {
    console.log(error);
  }
};

exports.freerideanddriver = async (req, res) => {
  const rideId = req.body.rideId
  const driverId = req.body.driverId
  try {
    const driver = await driverModel.findByIdAndUpdate(driverId, { $set: { assign: "0" } }, { new: true });
    const ride = await createrideModel.findByIdAndUpdate(rideId, { $unset: { driverId: "", assigningTime: "" } }, { new: true })
    // var counter2 = global.counter
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
    global.io.emit('rideupdates', { ride, driver, counter2:counter[0].count });
    res.json({ success: true, ride, driver });
  } catch (error) {
    console.log(error);
  }
};






