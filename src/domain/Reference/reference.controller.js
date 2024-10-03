const httpStatus = require('http-status');

// const ApiError = require('../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const referenceService = require('./reference.service');
const ApiError = require('../../utils/ApiError');

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

/**
 *  Consult Step 2
 * we will create Reference Model
 *
 * @param req.body => consult Id
 * @param req.body => slot-time
 * @param req.body => ref_type
 * @param req.user => customer
 *
 */
const createReference = catchAsync(async (req, res) => {
  // Get Slot-time and ref_type

  const referenceBody = {
    customer: req.user.id,
    consultId: req.body.consultId,
    ref_type: req.body.ref_type,
    consultant_dr_id: req.body.consultant_dr_id,
  };

  const newReference = await referenceService.createReference({ referenceBody });
  res.status(httpStatus.CREATED).send(newReference);
});

const verifyPaymentForReference = catchAsync(async (req, res) => {
  // Get Slot-time and ref_type

  const authorities = req.query.Authority;
  const paymentStatusFromQuery = req.query.Status;

  if (paymentStatusFromQuery !== 'OK') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment Status Fail from Bank');
  }

  const referenceBody = {
    authority: authorities,
  };

  const newReference = await referenceService.verifyPaymentForReference({ referenceBody });
  res.status(httpStatus.CREATED).send(newReference);
});


const implementSession = catchAsync(async (req, res) => {

  const { reference_id } = req.params;
  // const { sessionDate } = req.body;

  // Get Reference From DB
  const referenceDoc = await referenceService.getSpecificReference({reference_id, customer: req.user.id});

  if (!referenceDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reference Not Exist In DB');
  }

  // check if payment status is true (in reference doc)
  if (!referenceDoc.payment_status) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment Not Done');
  }

  // Get Time-Slot Id form user

  // Send SMS to User
  // Send SMS and email to Admin
  // create reference_code code rahgiri


  res.json({referenceDoc})


})

module.exports = {
  getAllReference,
  getSpecificReference,
  verifyPaymentForReference,
  implementSession,
  createReference,
};
