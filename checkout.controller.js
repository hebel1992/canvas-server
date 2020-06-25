const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const {getDocData} = require('./data-base')

exports.createCheckoutSession = async (req, res, next) => {
    try {
        const items = req.body.items;
        const callbackUrl = req.body.callbackUrl;
        let sessionConfig = await setupImagesPurchaseSession(callbackUrl, items);
        const session = await stripe.checkout.sessions.create(sessionConfig);
        await res.status(200).json({
            stripeCheckoutSessionId: session.id,
            stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY
        })
    } catch (err) {
        next(err);
    }
}

async function setupImagesPurchaseSession(callbackUrl, items) {
    const lineItems = await processArray(items);
    const config = {
        success_url: callbackUrl + '?purchaseResult=success',
        cancel_url: callbackUrl + '?purchaseResult=failed',
        payment_method_types: ['card'],
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
