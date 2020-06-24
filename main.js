const env = require('dotenv');

const envConf = env.config();
if (envConf.error) {
    throw envConf.error;
}

const {serverInit} = require('./app');
serverInit();
