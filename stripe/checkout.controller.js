const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const firestore = require('../data-base')
const {Timestamp} = require('@google-cloud/firestore')

exports.createCheckoutSession = async (req, res, next) => {
    let error;
    try {
        const items = req.body.items;
        const callbackUrl = req.body.callbackUrl;
        const userId = req.body.userId

        const userExists = await firestore.checkIfUserExistsInDB(userId);
        if (userId !== 'NoUser' && !userExists) {
            error = new Error('User authentication failed');
            error.statusCode = 403;
            throw error;
        }
        if (!items || items.length < 1) {
            error = new Error('Items not found');
            error.statusCode = 403;
            throw error;
        }

        const dbSessionObject = {
            status: 'ongoing',
            created: Timestamp.now(),
            items: items,
            userId: userId
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
        success_url: callbackUrl + '?purchaseResult=success&ongoingSessionId=' + sessionId,
        cancel_url: callbackUrl + '?purchaseResult=failed',
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
