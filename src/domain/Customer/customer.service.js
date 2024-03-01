// const { ObjectID } = require('mongoose');
const httpStatus = require('http-status');

// Models
const Customer = require('./customer.model');

// utils
const ApiError = require('../../utils/ApiError');

// const pick = require('../../utils/pick');
// const ApiError = require('../../utils/ApiError');
// const catchAsync = require('../../utils/catchAsync');
const APIFeatures = require('../../utils/APIFeatures');

// const getUsers = catchAsync(async (req, res) => {
//     const filter = pick(req.query, ['name', 'role']);
//     const options = pick(req.query, ['sortBy', 'limit', 'page']);
//     const result = await userService.queryUsers(filter, options);
//     res.send(result);
//   });

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */

// ADMIN ACCESS
const getAllCustomers = async ({ query }) => {
  const features = new APIFeatures(Customer.find(), Customer, query).filter().sort().limitFields().paginate();
  const customer = await features.query;

  const { total } = features.count();
  return { data: { total, count: customer.length, customer } };
};

//* * GET CUSTOMER :: Get `/me` **/
const getCustomer = async ({ id, mobile }) => {
  // get customer with mobile or id

  const customerDetectorWithQuery = { ...(id && { _id: id }), ...(mobile && { mobile }) };

  const customer = await Customer.find(customerDetectorWithQuery);

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Selected Customer Not Found!');
  }

  return { data: customer };
};

/**
 ******************************
 * ** Create Customer Service **
 ******************************
 * @returns saved customer in database
 */
const createCustomer = async ({ customer }) => {
  const newCustomer = new Customer(customer);
  const savedCustomer = await newCustomer.save();

  if (!savedCustomer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer Could Not Save');
  }

  return { data: savedCustomer };
};

module.exports = {
  getAllCustomers,
  getCustomer,
  createCustomer,
};
