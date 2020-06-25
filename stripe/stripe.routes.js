const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

const checkoutController = require('./checkout.controller');
const webHooks = require('./webHooks.controller');

router.post('/api/stripe/checkout', bodyParser.json(), checkoutController.createCheckoutSession);

router.post('/stripe-webhooks', bodyParser.raw({type: 'application/json'}), webHooks.stripeWebHooks)

// router.post('/api/stripe/full-fill-test', bodyParser.json(), webHooks.fullFillTest)

module.exports = router;
