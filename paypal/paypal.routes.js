const express = require('express');
const bodyParser = require('body-parser');
const {body} = require('express-validator');
const router = express.Router();
const verify = require('../dataVerification')

const createOrderController = require('./createOrder.controller')
const captureOrderController = require('./caputreOrder.controller')

router.post('/api/paypal/create-order', bodyParser.json(), [
    body('userData.userTitle').custom((value, {req}) => {
        if (value !== 'mr' && value !== 'mrs') {
            throw new Error()
        }
        return true
    }),
    body(['userData.firstName', 'userData.lastName']).trim().isLength({min: 2}),
    body('userData.email', 'userData.lastName').trim().isEmail(),
    body('userData.phone', 'userData.lastName').trim().isLength({min: 9, max: 15}),
    body('userData.addressLine1').trim().isLength({min: 5}),
    body('userData.city').trim().isLength({min: 2}),
    body('userData.postCode').trim().isLength({min: 5, max: 7})
], verify.dataVerification, createOrderController.createOrder);
router.post('/api/paypal/capture-order', bodyParser.json(), captureOrderController.captureOrder);

// router.post('/api/paypal/test-method', bodyParser.json(), captureOrderController.testMethod);

module.exports = router;
