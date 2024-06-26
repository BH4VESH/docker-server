const Data = require('../models/vehiclePriceModel');
const {mongoose } = require('mongoose');

exports.createData = async (req, res) => {
  try {
    const { countryId, cityId, vehicleId } = req.body;
    console.log(req.body)
    const existingData = await Data.findOne({ countryId, cityId, vehicleId });

    if (existingData) {
      return res.status(400).json({ success: false, message: 'Same country, city, and vehicle already exists.' });
    }
    const data = new Data(req.body);
    await data.save();
    res.json({ success: true, message: "Data added successfully" ,data});
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Error saving data' });
  }
};

exports.getData = async (req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
  try {
    const result = await Data.aggregate(
      [
        {
          $lookup: {
            from: "countries",
            localField: "countryId",
            foreignField: "_id",
            as: "country"
          }
        },
        {
          $unwind: {
            path: "$country",
          }
        },
        {
          $lookup: {
            from: "zones",
            localField: "cityId",
            foreignField: "_id",
            as: "city"
          }
        },
        {
          $unwind: {
            path: "$city",
          }
        },
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicleId",
            foreignField: "_id",
            as: "vehicle"
          }
        },
         {
          $unwind: {
            path: "$vehicle",
          }
        },
        {
          $addFields: {
            country: "$country.countryName"
          }
        },
        {
          $addFields: {
            city: "$city.name"
          }
        },
        {
          $addFields: {
            vehicle: "$vehicle.name"
          }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ]
    )
    const totalItems = await Data.countDocuments();

    res.json({success:true,message:"data fatch successfull",result,totalItems})

  } catch (error) {
    console.log(error)
    res.json({success:false,error})
  }
}


exports.updatePrice = async (req, res) => {

  try {
    const Id = req.params.id;
    const { selectedCountryId,
      selectedCityId,
      selectedVehicleId,
      Driver_Profit,
      min_fare,
      Distance_for_base_price,
      Base_price,
      Price_per_Unit_Distance,
      Price_per_Unit_time,
      Max_space } = req.body;

    let updatedFields = {};

    if (selectedCountryId) updatedFields.selectedCountryId = selectedCountryId;
    if (selectedCityId) updatedFields.selectedCityId = selectedCityId;
    if (selectedVehicleId) updatedFields.selectedVehicleId = selectedVehicleId;
    if (Driver_Profit) updatedFields.Driver_Profit = Driver_Profit;
    if (min_fare) updatedFields.min_fare = min_fare;
    if (Distance_for_base_price) updatedFields.Distance_for_base_price = Distance_for_base_price;
    if (Base_price) updatedFields.Base_price = Base_price;
    if (Price_per_Unit_Distance) updatedFields.Price_per_Unit_Distance = Price_per_Unit_Distance;
    if (Price_per_Unit_time) updatedFields.Price_per_Unit_time = Price_per_Unit_time;
    if (Max_space) updatedFields.Max_space = Max_space;


    const existingData = await Data.findOne({
      $and: [
        { _id: { $ne: Id } },
        {countryId: selectedCountryId },
        { cityId:selectedCityId },
        { vehicleId:selectedVehicleId }
      ]
    });

    // console.log(existingData)

    if (existingData) {
      return res.status(400).json({ success: false, message: 'Same country, city, and vehicle already exists.' });
    }else{
      const updatedPrice = await Data.findByIdAndUpdate(Id, updatedFields, { new: true });
  
      res.json({success:true,message:"data update successfull",updatedPrice})

    }


  }catch (error) {
    console.log(error)
    res.json({success:false,error})
  }
}