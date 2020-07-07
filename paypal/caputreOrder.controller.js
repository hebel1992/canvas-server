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
    await fullFillPurchase(userId, items, orderId);
}

async function fullFillPurchase(userId, items, purchaseSessionId) {
    const batch = firestore.db.batch();

    //user data update
    if (userId && userId !== 'UserNotRegistered') {
        const userShoppingHistory = await firestore.db.collection('users').doc(userId).collection('shoppingHistory').doc(purchaseSessionId.toString());
        batch.set(userShoppingHistory, {items: items, timestamp: Timestamp.now(), paymentMethod: 'paypal'});
        const user = await firestore.db.doc(`users/${userId}`);
        batch.update(user, {basket: []})

        // const userRef = firestore.db.doc(`users/${userId}`);
        // batch.set(userRef, {stripeCustomerId: stripeCustomerId}, {merge: true});
    }

    //session status update
    const purchaseSessionRef = await firestore.db.doc(`purchaseSessions/${purchaseSessionId}`);
    batch.update(purchaseSessionRef, {status: 'completed'})

    return batch.commit();
}
