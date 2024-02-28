const Kavenegar = require('kavenegar');
const {
  smsConfig,
} = require('../../../config/vars');

const api = Kavenegar.KavenegarApi({
  apikey: smsConfig.key,
});

module.exports = api;
