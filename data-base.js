const Firestore = require('@google-cloud/firestore')
const {Timestamp} = require('@google-cloud/firestore');
const serviceAccountPath = `./service-accounts/${process.env.SERVICE_ACCOUNT_FILE_NAME}`

const db = new Firestore({
    projectId: process.env.PROJECT_ID,
    keyFilename: serviceAccountPath
})

const getData = exports.getDocData = async (docPath) => {
    const snap = await db.doc(docPath).get();
    return snap.data();
}

exports.createDBSessionAndGetId = async (sessionDbObject) => {
    const doc = await db.collection('purchaseSessions').doc();
    await doc.set(sessionDbObject);
    return doc.id;
}

exports.createDBSessionWithSpecifiedId = async (sessionDbObject, sessionId) => {
    const doc = await db.collection('purchaseSessions').doc(sessionId);
    await doc.set(sessionDbObject);
}

exports.checkIfUserExistsInDB = async (userId) => {
    const userRef = await db.collection('users').doc(userId).get();
    return userRef.exists
}

exports.fullFillPurchaseInDB = async (userId, items, purchaseSessionId, paymentMethod, stripeCustomerId) => {
    const batch = db.batch();
    //user data update
    if (userId && userId !== 'UserNotRegistered') {
        const {purchaseType} = await getData(`purchaseSessions/${purchaseSessionId}`);

        const userShoppingHistory = db.collection('users').doc(userId).collection('shoppingHistory').doc(purchaseSessionId.toString());
        batch.set(userShoppingHistory, {items: items, timestamp: Timestamp.now(), paymentMethod: paymentMethod});

        const userRef = db.doc(`users/${userId}`);
        if (purchaseType === 'multiple') {
            batch.update(userRef, {basket: []})
        }
        if (stripeCustomerId) {
            batch.set(userRef, {stripeCustomerId: stripeCustomerId}, {merge: true});
        }
    }

    //session status update
    const purchaseSessionRef = await db.doc(`purchaseSessions/${purchaseSessionId}`);
    batch.update(purchaseSessionRef, {status: 'completed'})

    return batch.commit();
}
