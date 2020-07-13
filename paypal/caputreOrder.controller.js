const paypal = require('@paypal/checkout-server-sdk');
const {getDocData, fullFillPurchaseInDB} = require('../data-base');

exports.captureOrder = async (req, res, next) => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET_KEY;

    const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    const client = new paypal.core.PayPalHttpClient(environment);

    const orderId = req.body.orderId;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
        await client.execute(request).catch(err => {
            throw JSON.parse(err.message)
        });

        const {userId, items} = await getDocData(`purchaseSessions/${orderId}`);
        await fullFillPurchaseInDB(userId, items, orderId, 'paypal', undefined);

        await res.status(200).json({
            message: 'Paypal order captured successfully'
        });
    } catch (err) {
        next(err);
    }
}
