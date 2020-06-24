const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

const checkoutController = require('./checkout.controller');

router.post('/api/stripe/checkout', bodyParser.json(), checkoutController.createCheckoutSession);

module.exports = router;
