const httpStatus = require('http-status');

// const ApiError = require('../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const referenceService = require('./reference.service');

const getAllReference = catchAsync(async (req, res) => {
  const result = await referenceService.getAllReference({ query: req.query });
  res.status(httpStatus.OK).send(result);
});

const getSpecificReference = catchAsync(async (req, res) => {
  const result = await referenceService.getSpecificReference({
    customer: req.query.customer,
    reference_id: req.params.reference_id,
  });
  res.status(httpStatus.OK).send(result);
});

const createReference = catchAsync(async (req, res) => {
  const newReference = await referenceService.createReference({ referenceBody: req.body });
  res.status(httpStatus.CREATED).send(newReference);
});

module.exports = {
  getAllReference,
  getSpecificReference,
  createReference,
};
