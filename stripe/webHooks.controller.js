const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const {Timestamp} = require('@google-cloud/firestore')
const firestore = require('../data-base')

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
    const {userId, items} = await firestore.getDocData(`purchaseSessions/${purchaseSessionId}`);
    await fullFillPurchase(userId, items, purchaseSessionId, session.customer);
}

async function fullFillPurchase(userId, items, purchaseSessionId, stripeCustomerId) {
    const batch = firestore.db.batch();

    //user data update
    if (userId && userId !== 'NoUser') {
        const userShoppingHistory = await firestore.db.collection('users').doc(userId).collection('shoppingHistory').doc();
        batch.set(userShoppingHistory, {items: items, timestamp: Timestamp.now()});
        const user = await firestore.db.doc(`users/${userId}`);
        batch.update(user, {basket: []})

        const userRef = firestore.db.doc(`users/${userId}`);
        batch.set(userRef, {stripeCustomerId: stripeCustomerId}, {merge: true});
    }

    //session status update
    const purchaseSessionRef = await firestore.db.doc(`purchaseSessions/${purchaseSessionId}`);
    batch.update(purchaseSessionRef, {status: 'completed'})

    return batch.commit();
}

// exports.testMethod = async (req, res, next) => {
//     // const user = await firestore.db.doc('users/dUqzl5KX7EP31jXtzoAywEyEipi2').get();
//     // console.log(user.data())
//     // stripeUserId = user.data().stripeCustomerId;
//     // console.log(stripeUserId)
//     //
//     // res.status(200).send();
// }

