const Country = require('../models/countryModel');

exports.getAllCountries = async (req, res) => {
    try {
        const countries = await Country.find();
        res.json(countries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCountry = async (req, res) => {
    const country = new Country({
        countryName: req.body.countryName,
        currency: req.body.currency,
        country_code: req.body.country_code,
        country_calling_code: req.body.country_calling_code,
        time_zone: req.body.time_zone,
        flag: req.body.flag,
        short_name:req.body.short_name
    });

    try {
        const newCountry = await country.save();
        res.status(201).json(newCountry);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};