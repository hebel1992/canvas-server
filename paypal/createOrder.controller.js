const paypal = require('@paypal/checkout-server-sdk');
const firestore = require('../data-base')
const {Timestamp} = require('@google-cloud/firestore')
const {validationResult} = require('express-validator');

exports.createOrder = async (req, res, next) => {
    const errors = validationResult(req);
    let error;
    const items = req.body.items;
    const callbackUrl = req.body.callbackUrl;
    const userId = req.body.userId;
    const userData = req.body.userData;

    const dbSessionObject = {
        status: 'ongoing',
        created: Timestamp.now(),
        items: items,
        userId: userId,
        userData: userData,
        paymentMethod: 'paypal'
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET_KEY;
// This sample uses SandboxEnvironment. In production, use LiveEnvironment
    const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    const client = new paypal.core.PayPalHttpClient(environment);
    const request = new paypal.orders.OrdersCreateRequest();

    try {
        if (!errors.isEmpty()) {
            error = new Error('Validation failed');
            error.statusCode = 422;
            throw error;
        }
        const userExists = await firestore.checkIfUserExistsInDB(userId);
        if (userId !== 'UserNotRegistered' && !userExists) {
            error = new Error('User authentication failed');
            error.statusCode = 403;
            throw error;
        }
        if (!items || items.length < 1) {
            error = new Error;
            error.message = 'Items not found!'
            error.statusCode = 403;
            throw error;
        }

        const processedRequest = await setupRequestBody(request, callbackUrl, items);

        // Call API with your client and get a response for your call
        const response = await executeOrder(client, processedRequest);
        await firestore.createDBSessionWithSpecifiedId(dbSessionObject, response.id);

        let approveLink;
        for (let i = 0; i < response.links.length; i++) {
            if (response.links[i].rel === 'approve') {
                approveLink = response.links[i].href;
            }
        }
        await res.status(200).json({
            message: 'Paypal order created successfully',
            redirect_url: approveLink
        });
    } catch (err) {
        next(err);
    }
}

async function executeOrder(client, request) {
    const response = await client.execute(request);
    return response.result;
}

async function setupRequestBody(request, callbackUrl, items) {
    const purchaseItems = await processArray(items);
    const totalPrice = getTotalPrice(purchaseItems);

    request.requestBody({
        intent: 'CAPTURE',
        application_context: {
            return_url: callbackUrl + '/paypal-redirect?purchaseResult=success',
            cancel_url: callbackUrl + '/paypal-redirect?purchaseResult=failed',
            brand_name: 'Canvas Shop Ltd',
            locale: 'en-UK',
            landing_page: 'BILLING',
            // "shipping_preference": "SET_PROVIDED_ADDRESS",
            user_action: 'CONTINUE'
        },
        purchase_units: [
            {
                amount: {
                    currency_code: "GBP",
                    value: totalPrice + 8,
                    breakdown: {
                        item_total: {
                            currency_code: 'GBP',
                            value: totalPrice
                        },
                        shipping: {
                            currency_code: 'GBP',
                            value: 8
                        }
                    }
                },
                items: purchaseItems
            }
        ]
    });
    return request;
}

async function processArray(items) {
    const imagesList = [];
    for (const elem of items) {
        await firestore.getDocData(`images/${elem.id}`).then(image => {
            imagesList.push({
                name: 'Photo',
                unit_amount: {
                    currency_code: "GBP",
                    value: +image.price
                },
                quantity: elem.quantity,
            });
        });
    }
    return imagesList;
}

function getTotalPrice(processedArray) {
    let total = 0;
    for (const elem of processedArray) {
        total = total + (elem.unit_amount.value * elem.quantity);
    }
    return total;
}
