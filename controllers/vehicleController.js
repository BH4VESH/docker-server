
const Vehicle = require('../models/vehicleModel');
const deleteImage = require('../middleware/deleteImage');

// Add a new vehicle
exports.addVehicle = async (req, res) => {
    try {
        const { name } = req.body;
        const existingVehicle = await Vehicle.findOne({ name });
        if (existingVehicle) {
            return res.status(400).json({ success: false, message: "Vehicle with the same name already exists" });
        }

        const icon = req.file.filename;
            const vehicle = new Vehicle({ name, icon });
            await vehicle.save();
            res.json({ success: true, message: "Vehicle added successfully", data: vehicle });
    } catch (error) {

        res.status(500).json({ success: false, error: error.message });
    }
};
// Get all vehicles
exports.getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        res.send(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
// Edit a vehicle
exports.editVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        const existingVehicle = await Vehicle.findOne({ name, _id: { $ne: id } });
        if (existingVehicle) {
            return res.status(400).json({ success: false, message: "Vehicle with the same name already exists" });
        }

        let icon = null;
        if (req.file) {
            const oldIcon = await Vehicle.findById(id);
            const iconPath = `../public/uploads/icons/${oldIcon.icon}`;
            deleteImage(iconPath);
            icon = req.file.filename;
        }

        const updateObject = icon ? { name, icon } : { name };
        let vehicle = await Vehicle.findByIdAndUpdate(id, updateObject, { new: true });

        res.json({ success: true, message: "Vehicle updated successfully", vehicle });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
