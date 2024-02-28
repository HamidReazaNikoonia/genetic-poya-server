const mongoose = require("mongoose");

const objectId = mongoose.Types.ObjectId;

// Enum Constant
const referenceStatusEnum = ["CREATED", "WAITING", "RESOLVE", "REJECTED"];
const referenceTypeEnum = ["HOZORI", "ONLINE", "BY_TELEPHONE"];

const referenceSchema = mongoose.Schema(
  {
    customer: {
      type: objectId, // Gets id of User
      required: true,
      ref: "Customer", // Adds relationship between Product and User
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    is_giftcard: {
      type: Boolean,
      default: false,
    },
    gifcard_code: Number,
    status: {
      type: String,
      enum: referenceStatusEnum,
    },
    ref_type: {
      type: String,
      enum: referenceTypeEnum,
    },
    qr_code: String,

    discountable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

referenceSchema.plugin(require("mongoose-autopopulate"));

// referenceSchema.virtual("url").get(function () {
//   return `/product/${this._id}`;
// });

const Reference = mongoose.model("Reference", referenceSchema);

module.exports = Reference;
