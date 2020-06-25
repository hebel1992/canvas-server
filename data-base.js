const Firestore = require('@google-cloud/firestore')

const serviceAccountPath = `./service-accounts/${process.env.SERVICE_ACCOUNT_FILE_NAME}`

const db = new Firestore({
    projectId: process.env.PROJECT_ID,
    keyFilename: serviceAccountPath
})

exports.getDocData = async (docPath) => {
    const snap = await db.doc(docPath).get();
    return snap.data();
}
