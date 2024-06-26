const twilio = require('twilio');
const dotenv=require("dotenv").config();

exports.sms=async (message)=>{
    try {
        // /*
        const accountSid = process.env.TWILIO_ACCOUNTSID;
        const authToken = process.env.TWILIO_AUTHTOKEN ;
        const twilioPhoneNumber = process.env.TWILIO_PHONENUMBER;
        
        const client = twilio(accountSid, authToken);
        const toPhoneNumber = '+919925386487'; 
        const messageBody = message
        client.messages
          .create({
            body: messageBody,
            from: twilioPhoneNumber,
            to: toPhoneNumber,
          })
          .then((message) => console.log(`Message sent. SID: ${message.sid}`))
          .catch((error) => console.error(`Error sending message: ${error.message}`));
        //   */
          
    } catch (error) {
        console.log(error)
        return { success: false, message: 'Error sending sms', error: error.message };
    }
}