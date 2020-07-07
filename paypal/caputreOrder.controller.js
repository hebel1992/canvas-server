const paypal = require('@paypal/checkout-server-sdk');

exports.captureOrder = async (req, res, next) => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET_KEY;

    const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    const client = new paypal.core.PayPalHttpClient(environment);

    const orderId = req.body.orderId;
    console.log(orderId);

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
        let response = await client.execute(request);

        console.log(`Response: ${JSON.stringify(response)}`);
        // If call returns body in response, you can get the deserialized version from the result attribute of the response.
        console.log(`Capture: ${JSON.stringify(response.result)}`);

        await res.status(200).json({
            message: 'Paypal order captured successfully'
        });
    } catch (err) {
        next(err);
    }
}
