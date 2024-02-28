const { ObjectID } = require('mongoose');
const httpStatus = require('http-status');

// Models
const { Product, Category } = require('./product.model');

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
// const queryProduct = async (filter, options) => {
//     const products = await Product.paginate(filter, options);
//     return users;
//   };

const getAllProduct = async ({ query }) => {
  const features = new APIFeatures(Product.find(), Product, query).filter().sort().limitFields().paginate();
  const products = await features.query;

  const total = await features.count().total;
  return { data: { total, count: products.length, products } };
};

const getAllUserProduct = async ({ query, user }) => {
  const features = new APIFeatures(Product.find({ user }), Product, query).filter().sort().limitFields().paginate();
  const products = await features.query;

  const total = await features.count().total;
  return { data: { total, count: products.length, products } };
};

/**
 ******************************
 * ** Create Product Service **
 ******************************
 * @param {Product}
 * @returns saved product in database
 */
const createProduct = async ({ product, query }) => {
  const { title, subtitle, description, ...rest } = product;
  const productBody = { title, subtitle, description, ...(product.brand && { brand: product.brand }) };
  // if product is a giftcard, we should disallow discounts
  if (rest.is_giftcard) {
    rest.discountable = false;
  }

  if (rest.category && ObjectID.isValid(rest.category)) {
    const selectedCategory = await Category.findById(rest.category);

    if (!selectedCategory) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Selected Category Not Found!');
    }
  }

  // tag=[9778,dfsdf,sdfdsf,dsfdsf]
  if (query.tag) {
    productBody.tag = query.tag;
  }

  return { data: productBody, query };
};

module.exports = {
  getAllProduct,
  getAllUserProduct,
  createProduct,
};
