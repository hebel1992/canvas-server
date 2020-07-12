const {validationResult} = require('express-validator');
const firestore = require('./data-base')

exports.dataVerification = async (req, res, next) => {
    const errors = validationResult(req);
    let error;

    const userId = req.body.userId;
    const items = req.body.items;
    const callbackUrl = req.body.callbackUrl
    const purchaseType = req.body.purchaseType;

    try {
        if (!errors.isEmpty()) {
            error = new Error('Validation failed.');
            error.statusCode = 422;
            throw error;
        }
        const userExists = await firestore.checkIfUserExistsInDB(userId);
        if (userId !== 'UserNotRegistered' && !userExists) {
            error = new Error('User authentication failed.');
            error.statusCode = 403;
            throw error;
        }
        if (!items || items.length < 1) {
            error = new Error('Items not found.');
            error.statusCode = 403;
            throw error;
        }
        if(!callbackUrl){
            error = new Error('An unexpected error occurred.');
            error.statusCode = 403;
            throw error;
        }
        if (purchaseType !== 'single' && purchaseType !== 'multiple') {
            error = new Error('An unexpected error occurred.');
            error.statusCode = 403;
            throw error;
        }
        next();
    } catch (err) {
        next(err);
    }
}
