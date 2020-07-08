const Firestore = require('@google-cloud/firestore')
const {Timestamp} = require('@google-cloud/firestore');
const serviceAccountPath = `./service-accounts/${process.env.SERVICE_ACCOUNT_FILE_NAME}`

const db = new Firestore({
    projectId: process.env.PROJECT_ID,
    keyFilename: serviceAccountPath
})

getDocData = async (docPath) => {
    const snap = await db.doc(docPath).get();
    return snap.data();
}

createDBSessionAndGetId = async (sessionDbObject) => {
    const doc = await db.collection('purchaseSessions').doc();
    await doc.set(sessionDbObject);
    return doc.id;
}

createDBSessionWithSpecifiedId = async (sessionDbObject, sessionId) => {
    const doc = await db.collection('purchaseSessions').doc(sessionId);
    await doc.set(sessionDbObject);
}

checkIfUserExistsInDB = async (userId) => {
    const userRef = await db.collection('users').doc(userId).get();
    return userRef.exists
}

fullFillPurchaseInDB = async (userId, items, purchaseSessionId, paymentMethod, stripeCustomerId) => {
    const batch = db.batch();

    //user data update
    if (userId && userId !== 'UserNotRegistered') {
        const userShoppingHistory = await db.collection('users').doc(userId).collection('shoppingHistory').doc(purchaseSessionId.toString());
        batch.set(userShoppingHistory, {items: items, timestamp: Timestamp.now(), paymentMethod: paymentMethod});
        const user = await db.doc(`users/${userId}`);
        batch.update(user, {basket: []})

        if(stripeCustomerId){
            const userRef = db.doc(`users/${userId}`);
            batch.set(userRef, {stripeCustomerId: stripeCustomerId}, {merge: true});
        }
    }

    //session status update
    const purchaseSessionRef = await db.doc(`purchaseSessions/${purchaseSessionId}`);
    batch.update(purchaseSessionRef, {status: 'completed'})

    return batch.commit();
}

module.exports = {
    db,
    getDocData: getDocData,
    createDBSessionAndGetId: createDBSessionAndGetId,
    createDBSessionWithSpecifiedId: createDBSessionWithSpecifiedId,
    checkIfUserExistsInDB: checkIfUserExistsInDB,
    fullFillPurchaseInDB: fullFillPurchaseInDB
}

