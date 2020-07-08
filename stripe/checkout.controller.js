const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const firestore = require('../data-base')
const {Timestamp} = require('@google-cloud/firestore')

exports.createCheckoutSession = async (req, res, next) => {
    const items = req.body.items;
    const callbackUrl = req.body.callbackUrl;
    const userId = req.body.userId;
    const userData = req.body.userData;

    try {
        const dbSessionObject = {
            status: 'ongoing',
            created: Timestamp.now(),
            items: items,
            userId: userId,
            userData: userData,
            paymentMethod: 'stripe'
        }

        const user = await firestore.getDocData(`users/${userId}`);

        const dbPurchaseSessionId = await firestore.createDBSessionAndGetId(dbSessionObject);
        let sessionConfig = await setupPurchaseSession(callbackUrl, items,
            dbPurchaseSessionId, user ? user.stripeCustomerId : undefined);
        const session = await stripe.checkout.sessions.create(sessionConfig);

        await res.status(200).json({
            stripeCheckoutSessionId: session.id,
            stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY
        })

    } catch (err) {
        next(err)
    }
}

async function setupPurchaseSession(callbackUrl, items, sessionId, stripeCustomerId) {
    const lineItems = await processArray(items);
    const config = {
        success_url: callbackUrl + '/stripe-redirect?purchaseResult=success&ongoingSessionId=' + sessionId,
        cancel_url: callbackUrl + '/stripe-redirect?purchaseResult=failed',
        payment_method_types: ['card'],
        client_reference_id: sessionId,
        line_items: lineItems
    }
    if (stripeCustomerId) {
        config.customer = stripeCustomerId
    }
    return config;
}

async function processArray(items) {
    const imagesList = [];
    for (const elem of items) {
        await firestore.getDocData(`images/${elem.id}`).then(image => {
            imagesList.push({
                name: 'Photo',
                amount: image.price * 100,
                currency: 'gbp',
                quantity: elem.quantity,
                images: [image.url]
            });
        });
    }
    return imagesList;
}
