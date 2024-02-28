const httpStatus = require('http-status');

// const ApiError = require('../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const productService = require('./product.service');

const getAllProducts = catchAsync(async (req, res) => {
  const result = await productService.getAllProduct({ query: req.query });
  res.status(httpStatus.OK).send(result);
});

const getAllUserProducts = catchAsync(async (req, res) => {
  const result = await productService.getAllUserProduct({ query: req.query, user: req.params.userId });
  res.status(httpStatus.OK).send(result);
});

const createProduct = catchAsync(async (req, res) => {
  const newProduct = await productService.createProduct({ product: req.body, query: req.query });
  res.status(httpStatus.CREATED).send(newProduct);
});

module.exports = {
  getAllProducts,
  getAllUserProducts,
  createProduct,
};
