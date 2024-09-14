const { ObjectID } = require('mongoose');
const httpStatus = require('http-status');
const { v4: uuidv4 } = require('uuid');

// Models
const Reference = require('./reference.model');
const Customer = require('../Customer/customer.model');
const Transaction = require('../Transaction/transaction.model');
const AdminSetting = require('../Admin/admin_setting.model');

// utils
const ApiError = require('../../utils/ApiError');
const getMobiles = require('../../utils/mobileValidation');
const ZarinpalCheckout = require('../../services/payment');

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

const getAllReference = async ({ query }) => {
  const features = new APIFeatures(Reference.find(), Reference, query).filter().sort().limitFields().paginate();
  const references = await features.query;

  const total = await features.count().total;
  return { data: { total, count: references.length, references } };
};

/**
 ******************************
 * ** Get Specific Reference **
 ******************************
 * @param
 * @returns {Reference}
 */
// eslint-disable-next-line camelcase
const getSpecificReference = async ({ customer, reference_id }) => {
  if (!ObjectID.isValid(reference_id)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Selected Reference Not Found!');
  }
  const reference = await Reference.findById(reference_id);

  if (!reference || reference.customer !== customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Selected Reference Not Found!');
  }

  return { data: { reference } };
};

/**
 ******************************
 * ** Create Reference Service **
 ******************************
 * @param { Reference }
 * @returns saved ref in database
 */
const createReference = async ({ referenceBody }) => {
  if (!referenceBody.customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer Not Defined in Request!');
  }

  // Get Customer
  // Get Mobile or customer id as argument
  const query = {};
  if (ObjectID.isValid(referenceBody.customer)) {
    // we have customer id
    query._id = referenceBody.customer;
  }

  if (!getMobiles(referenceBody.customer)[0]) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer Not Defined By Mobile Number');
  } else {
    query.mobile = referenceBody.customer;
  }

  const customerFromDB = await Customer.find(query);

  if (!customerFromDB) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer Not Defined in DB!');
  }

  // Get Price ref_type
  const getReferencePriceFromSetting = await AdminSetting.find();

  if (!getReferencePriceFromSetting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Error For Getting Price From Setting');
  }

  let selectedRefrencePrice = null;

  if (getReferencePriceFromSetting[0]) {
    if (getReferencePriceFromSetting[0].payment) {
      selectedRefrencePrice = getReferencePriceFromSetting[0].payment.reference_price;
    }
  }

  if (!selectedRefrencePrice) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Error For Getting Price From Setting');
  }

  const referenceReq = {
    customer: customerFromDB._id,
    ref_type: referenceBody.ref_type,
    price: selectedRefrencePrice,
    status: 'CREATED',
    ...(referenceBody.description && { description: referenceBody.description }),
  };

  // if product is a giftcard, we should disallow discounts
  if (referenceReq.is_giftcard) {
    referenceReq.discountable = false;
    // check gifcard
  }

  const newReference = new Reference(referenceReq);
  const savedReference = await newReference.save();

  if (!savedReference) {
    throw new ApiError(httpStatus[500], 'Reference Could Not Save In DB');
  }

  /**
   * Payment SECTION
   *
   *  */

  // Send Payment Request to Get TOKEN
  const factorNumber = uuidv4();

  const zarinpal = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', true);
  const payment = await zarinpal.PaymentRequest({
    Amount: savedReference.price,
    CallbackURL: 'http://localhost:3030/payment-result',
    Description: '---------',
    Mobile: customerFromDB.mobile,
    order_id: factorNumber,
  });

  // Validate Payment Request

  if (!payment || payment.status !== 100) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Payment Error with status => ${payment.status || null}`);
  }

  // Create New Transaction
  const transaction = new Transaction({
    // coachUserId: 'NOT_SELECTED',
    userId: customerFromDB._id,
    amount: savedReference.price,
    factorNumber,
  });

  const savedTransaction = await transaction.save();

  if (!savedTransaction) {
    throw new ApiError(httpStatus[500], 'Transaction Could Not Save In DB');
  }

  return { data: savedReference, transaction: savedTransaction };
};

module.exports = {
  getAllReference,
  getSpecificReference,
  createReference,
};
