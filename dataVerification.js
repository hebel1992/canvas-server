const {validationResult} = require('express-validator');
const firestore = require('./data-base')

exports.dataVerification = async (req, res, next) => {
    const errors = validationResult(req);
    let error;

    const requestBody = req.body;
    const {items, callbackUrl, userId, purchaseType} = requestBody;

    try {
        if (!errors.isEmpty()) {
            error = new Error('Form validation failed. ');
            error.statusCode = 403;
            throw error;
        }
        const userExists = await firestore.checkIfUserExistsInDB(userId);
        if (userId !== 'UserNotRegistered' && !userExists) {
            error = new Error('Authentication failed.');
            error.statusCode = 401;
            throw error;
        }
        if (!items || items.length < 1) {
            error = new Error('Items not found.');
            error.statusCode = 403;
            throw error;
        }
        if (!callbackUrl || purchaseType !== 'single' && purchaseType !== 'multiple') {
            error = new Error('Request body contains incorrect data or some data is missing');
            error.statusCode = 403;
            throw error;
        }
        next();
    } catch (err) {
        next(err);
    }
}
