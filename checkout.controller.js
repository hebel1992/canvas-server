const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const {getDocData} = require('./data-base')
const {createDBSessionAndGetId} = require('./data-base')
const {Timestamp} = require('@google-cloud/firestore');

exports.createCheckoutSession = async (req, res, next) => {
    try {
        const items = req.body.items;
        const callbackUrl = req.body.callbackUrl;

        const dbSessionObject = {
            status: 'ongoing',
            created: Timestamp.now(),
            items: items
        }

        const dbPurchaseSessionId = await createDBSessionAndGetId(dbSessionObject);
        let sessionConfig = await setupPurchaseSession(callbackUrl, items, dbPurchaseSessionId);
        const session = await stripe.checkout.sessions.create(sessionConfig);

        await res.status(200).json({
            stripeCheckoutSessionId: session.id,
            stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY
        })

    } catch (err) {
        next(err);
    }
}

async function setupPurchaseSession(callbackUrl, items, sessionId) {
    const lineItems = await processArray(items);
    const config = {
        success_url: callbackUrl + '?purchaseResult=success',
        cancel_url: callbackUrl + '?purchaseResult=failed',
        payment_method_types: ['card'],
        client_reference_id: sessionId,
        line_items: lineItems
    }
    return config;
}

async function processArray(items) {
    const imagesList = [];
    for (const elem of items) {
        await getDocData(`images/${elem.id}`).then(image => {
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
