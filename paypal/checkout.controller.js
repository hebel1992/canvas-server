const payPal = require('@paypal/checkout-server-sdk');
const firestore = require('../data-base')
const {Timestamp} = require('@google-cloud/firestore')
const {validationResult} = require('express-validator');

exports.testMethod = async (req, res, next) => {
    console.log('test endpoint hit');

    let clientId = process.env.PAYPAL_CLIENT_ID;
    let clientSecret = process.env.PAYPAL_SECRET_KEY;
// This sample uses SandboxEnvironment. In production, use LiveEnvironment
    let environment = new payPal.core.SandboxEnvironment(clientId, clientSecret);
    let client = new payPal.core.PayPalHttpClient(environment);

    let request = new payPal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "USD",
                    value: "100.00"
                }
            }
        ]
    });

// Call API with your client and get a response for your call
    const createOrder = async () => {
        let response = await client.execute(request);
        // console.log(`Response: ${JSON.stringify(response)}`);
        // If call returns body in response, you can get the deserialized version from the result attribute of the response.
        console.log(`Order: ${JSON.stringify(response.result)}`);
    }
    await createOrder();

    try {
        res.status(200).json({
            message: 'All good'
        });

    } catch (err) {
        next(err);
    }
}
