/* eslint-disable eqeqeq */
/* eslint-disable no-unused-vars */
const httpStatus = require('http-status');
const Axios = require('axios');
const { paymentConfig } = require('../../../config/vars');
const APIError = require('../../utils/APIError');

const { api, redirectUrl } = paymentConfig;

const apiEndpoints = {
  payReq: 'https://pay.ir/pg/send',
  redirectReq: 'https://pay.ir/pg/',
  verifyReq: 'https://pay.ir/pg/verify',
};


exports.pay = async (
  amount,
  factorNumber = null,
  mobile = null,
  description = null,
  validCardNumber = null,
) => {
  try {
    const Err = (message, err = null) => new APIError({
      message,
      errors: err,
      status: httpStatus.BAD_REQUEST,
      isPublic: true,
    });

    if (typeof amount !== 'number' || amount < 1000) {
      throw Err('amount must be a number and equal/greater than 1000');
    }

    const response = await Axios.post(apiEndpoints.payReq, {
      amount,
      api,
      factorNumber,
      redirect: redirectUrl,
    });

    console.log('response');
    console.log(response);

    if (!response || response.status !== 200 || !response.data) {
      throw Err('API INTERNAL ERROR');
    }

    if (response.data.status !== 1) {
      throw Err('422 API Internal Error', [response.data.errorCode || '', response.data.errorMessage || '']);
    }

    return response.data;
  } catch (error) {
    throw new APIError({
      errors: error.message || '',
      status: httpStatus.BAD_REQUEST,
    });
  }
};

exports.verifyPay = async (token = '') => {
  try {
    if (!token || token === '') return false;
    const response = await Axios.post(apiEndpoints.verifyReq, {
      api,
      token,
    });
    if (!response || !response.data || response.status !== 200) {
      throw new APIError({
        message: 'Cant Verify Transaction',
        status: httpStatus.BAD_REQUEST,
      });
    }

    return response.data;
  } catch (error) {
    throw new APIError({
      message: 'Cant Verify Transaction',
      status: httpStatus.BAD_REQUEST,
    });
  }
};
