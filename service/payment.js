require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SK);
const driverListModel = require('../models/driverListModel');
const { default: mongoose } = require('mongoose');
const { mail } = require('../service/mail');

exports.chargeCustomer = async (customerId, amount, driverAcc, ride) => {
    try {
        const newAmount = Math.round(amount * 100);

        //   Transfer to driver
        var driverPay = async () => {
            const driverProfit = await driverListModel.aggregate(
                [
                    {
                        $lookup: {
                            from: "vehicle_prices",
                            let: {
                                cityId: "$cityId",
                                serviceID: "$serviceID"
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$cityId", "$$cityId"] },
                                                { $eq: ["$vehicleId", "$$serviceID"] }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: "profit"
                        }
                    },
                    {
                        $unwind: {
                            path: "$profit",
                        }
                    },
                    {
                        $project: {
                            profit: "$profit.Driver_Profit"
                        }
                    }
                ]
            )

            // console.log("ppppppppppppppppppp", driverProfit)
            const driverAmount = (amount * driverProfit[0].profit) / 100;
            const transfer = await stripe.transfers.create({
                amount: Math.round(driverAmount * 100),
                currency: 'usd',
                destination: driverAcc,
            });
        }


        // check card
        const customer = await stripe.customers.retrieve(customerId);
        const defaultPaymentMethodId = customer.invoice_settings.default_payment_method;

        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", customer)
        // if (!defaultPaymentMethodId) {
        //     return { success: false, message: 'No default payment method found for the customer' };
        // }

        if (!customer.default_source) {
            return { success: false, message: 'Case Payment' };
        } else {

            console.log("payment option:", ride.paymentOption)

            if (ride.paymentOption == 'Card') {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: newAmount,
                    currency: 'usd',
                    customer: customerId,
                    payment_method_types: ['card'],
                    confirm: true,
                    payment_method: customer.default_source,
                    setup_future_usage: 'off_session',
                    capture_method: 'automatic',
                    // receipt_email: 'narolabhavesh548@gmail.com',

                    return_url: 'http://localhost:4200/admin/confirmed_rides'
                });

                const invoice = await stripe.invoices.create({
                    customer: customerId,
                    description: 'Invoice for ride',
                    collection_method: 'send_invoice',
                    days_until_due: 30,
                });
                // // Send the invoice
                const sentInvoice = await stripe.invoices.sendInvoice(invoice.id);
                console.log('Invoice sent:', sentInvoice);

                driverPay()
                // console.log("-------------------------it is paymenntIntent :", paymentIntent)

                if (paymentIntent.status === 'requires_action' && paymentIntent.next_action.type === 'redirect_to_url') {
                    await mail(sentInvoice, ride)
                    return {
                        success: false,
                        message: '3D Secure authentication required',
                        // paymentIntentStatus:paymentIntent.status,
                        // clientSecret: paymentIntent.client_secret,
                        auth_redirectUrl: paymentIntent.next_action.redirect_to_url.url,
                    };
                } else if (paymentIntent.status === 'succeeded') {
                    await mail(sentInvoice, ride)
                    return { success: true, message: 'Payment successful' };
                } else {
                    return { success: false, message: 'payment fail' };
                }

            } else {
                driverPay()
                return { success: false, message: 'Driver payment success' };
            }

            // add fund
            //  4000000000000077


        }

    } catch (error) {
        console.error('Error charging customer:', error);
        return { success: false, message: 'Error charging customer', error: error.message };
    }
};
