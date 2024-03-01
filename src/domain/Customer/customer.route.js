const express = require('express');
// const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const customerValidation = require('./customer.validation');

// const userController = require('../../controllers/user.controller');
const customerController = require('./customer.controller');

const router = express.Router();

router
  .route('/')
  .get(customerController.getAllCustomers)
  .post(validate(customerValidation.createCustomer), customerController.createCustomer);

// router.route('/:userId').get(userController.getUser);

module.exports = router;
