const Setting = require('../models/settingModel');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

/*
exports.saveSetting = async (req, res) => {
    try {
        const {selectedSeconds, selectedStopCount} = req.body;
        console.log(req.body)
        const email_user=req.body.settings.email_user
        const email_password=req.body.settings.email_password
        const twilio_accountSid=req.body.settings.twilio_accountSid
        const twilio_authToken=req.body.settings.twilio_authToken
        const twilio_PhoneNumber=req.body.settings.twilio_PhoneNumber
        const stripe_sk=req.body.settings.stripe_sk
        const stripe_pk=req.body.settings.stripe_pk
        
        const updatedSetting = { selectedSeconds, selectedStopCount ,email_user,stripe_pk,stripe_sk,twilio_PhoneNumber,twilio_authToken,twilio_accountSid,email_password};
        const setting = await Setting.findOneAndUpdate(
            {},
            updatedSetting,
            { new: true }
        );
        if (!setting) {
            const newSetting = new Setting(updatedSetting);
            await newSetting.save();
            res.status(201).json({ message: 'Setting saved successfully', setting: newSetting });
        } else {
            res.status(200).json({ message: 'Setting updated successfully', setting });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving setting' });
    }
};
*/
exports.saveSetting = async (req, res) => {
    try {
        const { selectedSeconds, selectedStopCount } = req.body;
        console.log(req.body)
        const updatedSetting = { selectedSeconds, selectedStopCount };

        if (req.body.settings && req.body.settings.email_user) {
            updatedSetting.email_user = req.body.settings.email_user;
        }

        if (req.body.settings && req.body.settings.email_password) {
            updatedSetting.email_password = req.body.settings.email_password;
        }

        if (req.body.settings && req.body.settings.twilio_accountSid) {
            updatedSetting.twilio_accountSid = req.body.settings.twilio_accountSid;
        }

        if (req.body.settings && req.body.settings.twilio_authToken) {
            updatedSetting.twilio_authToken = req.body.settings.twilio_authToken;
        }

        if (req.body.settings && req.body.settings.twilio_PhoneNumber) {
            updatedSetting.twilio_PhoneNumber = req.body.settings.twilio_PhoneNumber;
        }

        if (req.body.settings && req.body.settings.stripe_sk) {
            updatedSetting.stripe_sk = req.body.settings.stripe_sk;
        }

        if (req.body.settings && req.body.settings.stripe_pk) {
            updatedSetting.stripe_pk = req.body.settings.stripe_pk;
        }


        const setting = await Setting.findOneAndUpdate(
            {},
            updatedSetting,
            { new: true }
        );

        // Function to update .env file
        async function updateEnvFile(setting) {
            try {
                // Read existing .env content
                const envFilePath = '.env';
                const envContent = fs.existsSync(envFilePath) ? fs.readFileSync(envFilePath, 'utf-8') : '';
                const envVariables = dotenv.parse(envContent);
        
                // Fields to be updated
                const fieldsToUpdate = [
                    'email_user',
                    'email_password',
                    'twilio_accountSid',
                    'twilio_authToken',
                    'twilio_PhoneNumber',
                    'stripe_sk',
                    'stripe_pk'
                ];
        
                // Update env variables with new settings
                fieldsToUpdate.forEach(field => {
                    if (setting[field]) {
                        envVariables[field.toUpperCase()] = setting[field];
                    }
                });
        
                let newEnvContent = '';
                for (const key in envVariables) {
                    newEnvContent += `${key}=${envVariables[key]}\n`;
                }
                fs.writeFileSync(envFilePath, newEnvContent);
        
                console.log('.env file updated successfully.');
            } catch (error) {
                console.error('Error updating .env file:', error);
            }
        }

        if (!setting) {
            const newSetting = new Setting(updatedSetting);
            await newSetting.save();
            await updateEnvFile(newSetting);
            res.status(201).json({ message: 'Setting saved successfully', setting: newSetting });
        } else {
            await updateEnvFile(setting);
            res.status(200).json({ message: 'Setting updated successfully', setting });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving setting' });
    }
};


exports.getSetting = async (req, res) => {
    try {
        const setting = await Setting.find();
        res.status(200).send(setting);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch setting' });
    }
};