const httpStatus = require('http-status');

// const ApiError = require('../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const customerService = require('./customer.service');
const ApiError = require('../../utils/ApiError');

const getAllCustomers = catchAsync(async (req, res) => {
  const result = await customerService.getAllCustomers({ query: req.query });
  res.status(httpStatus.OK).send(result);
});

const getCustomer = catchAsync(async (req, res) => {
  if (!req.query.id || req.query.mobile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Selected Customer Not Found!');
  }
  const result = await customerService.getCustomer({ id: req.query.id, mobile: req.query.mobile });
  res.status(httpStatus.OK).send(result);
});

const createCustomer = catchAsync(async (req, res) => {
  const newCustomer = await customerService.createCustomer({ customer: req.body });
  res.status(httpStatus.CREATED).send(newCustomer);
});

module.exports = {
  getAllCustomers,
  getCustomer,
  createCustomer,
};
