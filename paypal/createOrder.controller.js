const paypal = require('@paypal/checkout-server-sdk');
const {createDBSessionWithSpecifiedId, getDocData} = require('../data-base')
const {Timestamp} = require('@google-cloud/firestore')

exports.createOrder = async (req, res, next) => {
    const items = req.body.items;
    const callbackUrl = req.body.callbackUrl;
    const userId = req.body.userId;
    const userData = req.body.userData;
    const purchaseType = req.body.purchaseType;

    const dbSessionObject = {
        status: 'ongoing',
        created: Timestamp.now(),
        items: items,
        userId: userId,
        userData: userData,
        paymentMethod: 'paypal',
        purchaseType: purchaseType
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET_KEY;
// This sample uses SandboxEnvironment. In production, use LiveEnvironment
    const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    const client = new paypal.core.PayPalHttpClient(environment);
    const request = new paypal.orders.OrdersCreateRequest();

    try {
        const processedRequest = await setupRequestBody(request, callbackUrl, items, purchaseType);

        // Call API with your client and get a response for your call
        const response = await executeOrder(client, processedRequest);
        await createDBSessionWithSpecifiedId(dbSessionObject, response.id);

        let approveLink;
        for (let i = 0; i < response.links.length; i++) {
            if (response.links[i].rel === 'approve') {
                approveLink = response.links[i].href;
            }
        }
        await res.status(200).json({
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

async function setupRequestBody(request, callbackUrl, items, purchaseType) {
    const purchaseItems = await processArray(items);
    const totalPrice = getTotalPrice(purchaseItems);

    request.requestBody({
        intent: 'CAPTURE',
        application_context: {
            return_url: `${callbackUrl}/payment-redirect?purchaseResult=success&purchaseType=${purchaseType}`,
            cancel_url: `${callbackUrl}/payment-redirect?purchaseResult=failed`,
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
        await getDocData(`images/${elem.id}`).then(image => {
            imagesList.push({
                name: 'Photo',
                unit_amount: {
                    currency_code: "GBP",
                    value: +image.price
                },
                quantity: elem.quantity,
                category: 'PHYSICAL_GOODS'
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
