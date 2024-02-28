const express = require('express');
// const auth = require('../../middlewares/auth');
// const validate = require('../../middlewares/validate');
// const userValidation = require('../../validations/user.validation');

const userController = require('../../controllers/user.controller');
const productController = require('./product.controller');

const router = express.Router();

router.route('/').get(productController.getAllProducts).post(productController.createProduct);

router.route('/:userId').get(userController.getUser);

module.exports = router;
