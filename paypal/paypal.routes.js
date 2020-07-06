const express = require('express');
const bodyParser = require('body-parser');
const {body} = require('express-validator');
const router = express.Router();

const checkoutController = require('./checkout.controller')

router.post('/api/paypal/test-method', bodyParser.json(), checkoutController.testMethod);

module.exports = router;
