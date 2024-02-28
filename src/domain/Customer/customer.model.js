const mongoose = require('mongoose');
// const validator = require('validator');
// const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
// const { roles } = require('../config/roles');

const getMobiles = require("../../utils/mobileValidation");


const customerSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    family: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      validate(val) {
        if(val === 0 || val <= 0 || val >= 120 ) {
          throw new Error(" Invalid age")
        }
      }
    },
    gender: {
      type: String,
      require: true,
      enum: ["MEN", "WOMEN"]
    },
    city: {
      type: String,
    },
    country: {
      type: String,
      default: "IRAN",
    },
    mobile: {
      type: String,
      required: true,
      validate(value) {
        if (!getMobiles(value)[0]) {
          throw new Error('Invalid Mobile');
        }
      },
    },
    email: {
      type: String,
      required: false,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
customerSchema.plugin(toJSON);
// userSchema.plugin(paginate);

/**
 * @typedef User
 */
const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
