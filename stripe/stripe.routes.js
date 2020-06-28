const express = require('express');
const bodyParser = require('body-parser');
const {body} = require('express-validator');
const router = express.Router();


const checkoutController = require('./checkout.controller');
const webHooks = require('./webHooks.controller');

router.post('/api/stripe/checkout', bodyParser.json(), [
    body(['userData.firstName', 'userData.lastName']).trim().isLength({min: 2}),
    body('userData.email', 'userData.lastName').trim().isEmail(),
    body('userData.phone', 'userData.lastName').trim().isLength({min: 9, max: 15}),
    body('userData.addressLine1').trim().isLength({min: 5}),
    body('userData.city').trim().isLength({min: 2}),
    body('userData.postCode').trim().isLength({min: 5, max: 7})
], checkoutController.createCheckoutSession);

router.post('/stripe-webhooks', bodyParser.raw({type: 'application/json'}), webHooks.stripeWebHooks)

// router.post('/api/stripe/test-method', bodyParser.json(), webHooks.testMethod)

module.exports = router;
