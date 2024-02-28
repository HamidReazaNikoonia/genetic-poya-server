const { ObjectID } = require("mongoose");
const httpStatus = require("http-status");

// Models
const { Reference } = require("./reference.model");

// utils
const ApiError = require("../../utils/ApiError");

// const pick = require('../../utils/pick');
// const ApiError = require('../../utils/ApiError');
// const catchAsync = require('../../utils/catchAsync');
const APIFeatures = require("../../utils/APIFeatures");

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
// const queryProduct = async (filter, options) => {
//     const products = await Product.paginate(filter, options);
//     return users;
//   };

const getAllReference = async ({ query }) => {
  const features = new APIFeatures(Product.find(), Product, query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
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
const getSpecificReference = async ({ customer, ref_id }) => {
  if (!ObjectID.isValid(ref_id)) {
    throw new ApiError(httpStatus.NOT_FOUND, "Selected Reference Not Found!");
  }
  const reference = await Reference.findById(ref_id);

  if (!reference || reference.customer !== customer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Selected Reference Not Found!");
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
const createReference = async ({ referenceBody, customer }) => {


  // Get Customer

  const { name, family, ref_type, age, gender, ...rest } = referenceBody;
  const referenceReq = {
    name,
    age,
    gender,
    family,
    description,
    ref_type,
    ...(referenceBody.description && { description: referenceBody.description }),
  };
  // if product is a giftcard, we should disallow discounts
  if (rest.is_giftcard) {
    rest.discountable = false;
    // check gifcard
  }

  // Get Priceref_type

  return { data: productBody, query };
};

module.exports = {
  getAllReference,
  getSpecificReference,
  createProduct,
};
