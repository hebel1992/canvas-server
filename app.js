exports.serverInit = function () {
    const express = require('express');
    const stripeRoutes = require('./stripe/stripe.routes');

    const app = express();

    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
    });

    app.use(stripeRoutes);

    app.use((req, res) => {
        res.status(200).send('<h1>API is up and running!</h1>');
    });

    app.use((error, req, res, next) => {
        console.log(error);
        const status = error.statusCode || 500;
        const message = error.message || 'Endpoint not found';
        const data = error.data;
        res.status(status).json({
            message: message,
            data: data
        })
    });

    const PORT = process.env.PORT || 9000;

    app.listen(PORT, () => {
            console.log(`HTTP REST APT Server is running at port ${PORT}`);
        }
    );
}
