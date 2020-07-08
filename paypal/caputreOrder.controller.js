const paypal = require('@paypal/checkout-server-sdk');
const {Timestamp} = require('@google-cloud/firestore');
const firestore = require('../data-base');

exports.captureOrder = async (req, res, next) => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET_KEY;

    const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    const client = new paypal.core.PayPalHttpClient(environment);

    const orderId = req.body.orderId;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
        let response = await client.execute(request);
        console.log(`Capture: ${JSON.stringify(response.result)}`);

        await onCheckoutSessionCompleted(orderId)

        await res.status(200).json({
            message: 'Paypal order captured successfully'
        });
    } catch (err) {
        next(err);
    }
}

async function onCheckoutSessionCompleted(orderId) {
    const {userId, items} = await firestore.getDocData(`purchaseSessions/${orderId}`);
    await firestore.fullFillPurchaseInDB(userId, items, orderId, 'paypal', undefined);
}

// exports.testMethod = async (req, res, next) => {
//     const clientId = process.env.PAYPAL_CLIENT_ID;
//     const clientSecret = process.env.PAYPAL_SECRET_KEY;
//
//     const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
//     const client = new paypal.core.PayPalHttpClient(environment);
//
//     const request = new paypal.orders.OrdersCaptureRequest('6KB324017U274311A');
//     request.requestBody({});
//
//     try {
//         let response = await client.execute(request);
//         console.log(`Capture: ${JSON.stringify(response.result)}`);
//
//         await onCheckoutSessionCompleted(orderId)
//
//         await res.status(200).json({
//             message: 'Paypal order captured successfully'
//         });
//     } catch (err) {
//         next(err);
//     }
// }
