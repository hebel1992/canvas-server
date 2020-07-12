const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {getDocData, fullFillPurchaseInDB} = require('../data-base');

exports.stripeWebHooks = async (req, res, next) => {
    try {
        const signature = req.headers['stripe-signature']
        const event = stripe.webhooks.constructEvent(
            req.body, signature, process.env.STRIPE_WEBHOOKS_SECRET)

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            await onCheckoutSessionCompleted(session)
        }

        await res.json({
            received: true
        })

    } catch (err) {
        next(err);
    }
}

async function onCheckoutSessionCompleted(session) {
    const purchaseSessionId = session.client_reference_id;
    const {userId, items} = await getDocData(`purchaseSessions/${purchaseSessionId}`);
    await fullFillPurchaseInDB(userId, items, purchaseSessionId, 'stripe', session.customer);
}

