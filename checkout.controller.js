const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

exports.createCheckoutSession = async (req, res, next) => {

    try {
        const items = req.body.items;
        const callbackUrl = req.body.callbackUrl;
        let sessionConfig = setupImagesPurchaseSession(callbackUrl);
        const session = await stripe.checkout.sessions.create(sessionConfig);
        console.log(session);
        res.status(200).send(session.id);
    } catch (err) {
        next(err);
    }
}

function setupImagesPurchaseSession(callbackUrl) {
    const config = {
        success_url: callbackUrl+'?/purchaseResult=success',
        cancel_url: callbackUrl+'?/purchaseResult=failed',
        payment_method_types: ['card'],
        line_items: [
            {
                name: 'photo',
                currency: 'usd',
                amount: 100,
                quantity: 2,
            },
        ]
    }
    return config;
}
