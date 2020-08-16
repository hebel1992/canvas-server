const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const {createDBSessionAndGetId, getDocData, updateUserData} = require('../data-base')
const {Timestamp} = require('@google-cloud/firestore')

exports.createCheckoutSession = async (req, res, next) => {

    const requestBody = req.body;
    const {items, callbackUrl, userId, userData, purchaseType} = requestBody;

    try {
        const dbSessionObject = {
            status: 'ongoing',
            created: Timestamp.now(),
            items: items,
            userId: userId,
            userData: userData,
            paymentMethod: 'card',
            purchaseType: purchaseType
        }

        const response = await Promise.all([
            getDocData(`users/${userId}`),
            createDBSessionAndGetId(dbSessionObject)]);

        const sessionConfig = await setupPurchaseSession(callbackUrl, items,
            response[1], response[0] ? response[0].stripeCustomerId : undefined, purchaseType, userData);

        const session = await stripe.checkout.sessions.create(sessionConfig);

        if (userId !== 'UserNotRegistered') {
            updateUserData(userId, userData).catch(err => {
                console.log('user data update failed');
            });
        }

        await res.status(200).json({
            stripeCheckoutSessionId: session.id,
            stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY
        });

    } catch (err) {
        next(err)
    }
}

async function setupPurchaseSession(callbackUrl, items, sessionId, stripeCustomerId, purchaseType, userData) {
    const lineItems = await processArray(items);
    const config = {
        success_url: `${callbackUrl}/payment-redirect?purchaseResult=success&ongoingSessionId=${sessionId}&purchaseType=${purchaseType}`,
        cancel_url: `${callbackUrl}/payment-redirect?purchaseResult=failed`,
        payment_method_types: ['card'],
        client_reference_id: sessionId,
        line_items: lineItems
    }
    if (stripeCustomerId) {
        config.customer = stripeCustomerId
    } else {
        config.customer_email = userData.email
    }
    return config;
}

async function processArray(items) {
    const imagesList = [];
    for (const elem of items) {
        const imageId = elem.id.trim();
        const image = await getDocData(`images/${imageId}`);
        imagesList.push({
            name: 'Photo',
            amount: image.price * 100,
            currency: 'gbp',
            quantity: elem.quantity,
            images: [image.url]
        });
    }
    imagesList.push({name: 'Shipping', amount: 800, currency: 'gbp', quantity: 1})
    return imagesList;
}
