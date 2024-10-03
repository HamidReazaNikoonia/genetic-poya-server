const { isValidObjectId } = require('mongoose');
const httpStatus = require('http-status');
const { v4: uuidv4 } = require('uuid');

// Models
const Reference = require('./reference.model');
const Customer = require('../Customer/customer.model');
const Transaction = require('../Transaction/transaction.model');
const AdminSetting = require('../Admin/admin_setting.model');
const UserModel = require('../../models/user.model');
const UserService = require('../../services/user.service');

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
  if (!isValidObjectId(reference_id)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Selected Reference Id Not Vaild!');
  }
  const reference = await Reference.findById(reference_id);


  if (!reference) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Selected Reference Not Found!');
  }

  if(reference.customer.toString() !== customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'This Reference Not For This Customer');
  }


  return reference;
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

  // [TASK]
  // Check If Consult DR ID is correct ( User with this id with DR role exist )

  if (referenceBody.consultant_dr_id) {
    const consultDrInDB = await UserService.getUserById(referenceBody.consultant_dr_id);

    if (!consultDrInDB) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Consult DR Not Exist In DB');
    }
  }

  // Get Customer
  // Get Mobile or customer id as argument
  const query = {};
  if (isValidObjectId(referenceBody.customer)) {
    // we have customer id
    query._id = referenceBody.customer;
  }

  // if (!getMobiles(referenceBody.customer)[0]) {
  //   throw new ApiError(httpStatus.NOT_FOUND, 'Customer Not Defined By Mobile Number');
  // } else {
  //   query.mobile = referenceBody.customer;
  // }

  const customerFromDB = await UserModel.findOne(query);

  if (!customerFromDB) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer Not Defined in DB!');
  }

  // Get Price ref_type
  let selectedRefrencePrice = null;
  const getReferencePriceFromSetting = await AdminSetting.find();

  if (getReferencePriceFromSetting) {
    // throw new ApiError(httpStatus.NOT_FOUND, 'Error For Getting Price From Setting');
    if (getReferencePriceFromSetting[0]) {
      if (getReferencePriceFromSetting[0].payment) {
        selectedRefrencePrice = getReferencePriceFromSetting[0].payment.reference_price;
      }
    }
  }

  if (!selectedRefrencePrice || isNaN(parseFloat(selectedRefrencePrice))) {
    // throw new ApiError(httpStatus.NOT_FOUND, 'Error For Getting Price From Setting');
    selectedRefrencePrice = 90000;
  }

  const referenceReq = {
    customer: customerFromDB._id,
    ...(referenceBody.consultant_dr_id && { consultant_dr_id: referenceBody.consultant_dr_id }),
    consult: referenceBody.consultId,
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
    CallbackURL: 'http://localhost:3000/v1/reference/verify',
    Description: '---------',
    Mobile: customerFromDB.mobile,
    order_id: factorNumber,
  });

  // Validate Payment Request

  if (!payment || payment.code !== 100) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Payment Error with status => ${payment.code || null}`);
  }

  // Create New Transaction
  const transaction = new Transaction({
    // coachUserId: 'NOT_SELECTED',
    userId: customerFromDB._id,
    reference_id: savedReference._id,
    amount: savedReference.price,
    factorNumber: payment.authority,
  });

  const savedTransaction = await transaction.save();

  if (!savedTransaction) {
    throw new ApiError(httpStatus[500], 'Transaction Could Not Save In DB');
  }

  return { data: savedReference, transaction: savedTransaction };
};

/**
 ******************************
 * ** Create Reference Service **
 ******************************
 * @param { Reference }
 * @returns saved ref in database
 */
const verifyPaymentForReference = async ({ referenceBody }) => {
  if (!referenceBody.authority) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'authority Not Defined in Request!');
  }

  // Check For Transaction
  const transactionDoc = await Transaction.findOne({ factorNumber: referenceBody.authority });

  if (!transactionDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not Found in DB');
  }


  // check for reference
  const referenceDoc = await Reference.findOne({_id: transactionDoc.reference_id});

  if (!referenceDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reference not Found in DB');
  }

  // Verify Payment
  const zarinpal = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', true);
  const payment = await zarinpal.PaymentVerification({
    amount: transactionDoc.amount,
    authority: referenceBody.authority,
  });

  if (!payment.data) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment Has Error From Bank');
  }

  if (payment.data.code !== 100) {
    switch (payment.data.code) {
      case -55:
        throw new ApiError(httpStatus.BAD_REQUEST, 'تراکنش مورد نظر یافت نشد');
        break;
      case -52:
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          ' خطای غیر منتظره‌ای رخ داده است. پذیرنده مشکل خود را به امور مشتریان زرین‌پال ارجاع دهد.'
        );
        break;
      case -50:
        throw new ApiError(httpStatus.BAD_REQUEST, 'مبلغ پرداخت شده با مقدار مبلغ ارسالی در متد وریفای متفاوت است.');
        break;
      default:
        throw new ApiError(httpStatus.BAD_REQUEST, `Payment Transaction Faild From ZarinPal with code => ${payment.data.code} `);
    }
  }

  if (payment.data.code === 101) {
    throw new ApiError(httpStatus[201], "تراکنش وریفای شده است.")
  }

  // Transaction Pay Successfully
  if (payment.data.code === 100 && payment.data.message === 'Paid') {

    // Update Transaction
      transactionDoc.status = true;
      transactionDoc.payment_reference_id = payment.data.ref_id;
      await transactionDoc.save();

    // Update Reference

    referenceDoc.payment_status = true;
    referenceDoc.status = "WAITING";
    await referenceDoc.save();

  }

  return {payment, transactionDoc, referenceDoc};
};

module.exports = {
  getAllReference,
  getSpecificReference,
  verifyPaymentForReference,
  createReference,
};
