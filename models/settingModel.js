const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    selectedSeconds: { type: Number, required: true },
    selectedStopCount: { type: Number, required: true },
    email_user: {},
    email_password: {},
    twilio_accountSid: {},
    twilio_authToken: {},
    twilio_PhoneNumber: {},
    stripe_sk: {},
    stripe_pk: {}
});

module.exports = mongoose.model('setting', settingSchema);