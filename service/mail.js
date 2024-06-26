const dotenv = require("dotenv").config();
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');

exports.mail = async (Invoice, ride) => {
    try {
        const mailGenerator = new Mailgen({
            theme: 'default',
            product: {
                name: 'Eber Ride',
                link: 'https://yourapp.com',
            },
        });

        const email = {
            body: {
                name: Invoice.customer_name,
                intro: 'Welcome to Eber texi App!',
                action: {
                    instructions: `
                    <p>Total Amount: ${ride.estimeteFare}</p>
                    <p>From: ${ride.fromLocation}</p>
                    <p>To: ${ride.toLocation}</p>
                    <p>To download Invoice, click the button below:</p>
                `,
                    button: {
                        color: '#22BC66',
                        text: 'Download',
                        link: Invoice.invoice_pdf,
                    },
                },
                outro: 'Need help, or have questions? Just reply to this email.',
            },
        };

        const emailBody = mailGenerator.generate(email);
        let config={
            service: 'gmail',
            auth: {

                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD

            }
        }
        const transporter = nodemailer.createTransport(config);

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: Invoice.customer_email,
            subject: Invoice.description,
            html: emailBody
        };


        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });


    } catch (error) {
        console.log(error)
        return { success: false, message: 'Error sending sms', error: error.message };
    }
}