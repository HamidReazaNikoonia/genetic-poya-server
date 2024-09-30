const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const referenceValidation = require('./reference.validation');

const referenceController = require('./reference.controller');

const router = express.Router();

/**
 * GET `api/reference` (ADMIN)
 * POST `api/reference`
 */
router
  .route('/')
  .get(referenceController.getAllReference)
  .post(auth(), validate(referenceValidation.createReference), referenceController.createReference);


router
.route('/verify')
.get(referenceController.verifyPaymentForReference);

/**
 * GET `api/reference/:reference_id`
 */
router
  .route('/:reference_id')
  .get(validate(referenceValidation.getSpecificReference), referenceController.getSpecificReference);


module.exports = router;
