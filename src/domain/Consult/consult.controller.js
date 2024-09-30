const httpStatus = require('http-status');

// const ApiError = require('../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const consultService = require('./consult.service');
const { userService } = require('../../services/index');
// const { createReference } = require('../Reference/reference.service');
const ApiError = require('../../utils/ApiError');

// Enum Constant
const ListOfIssues = [' کوتاهی قد', ' بیماری قلبی']; // Enum

const ResultReason = ['RelationShip', 'Have_Issues'];

const ListOfCheckBox = [
  {
    id: 0,
    title: 'خودتان',
    value: false,
  },
  {
    id: 1,
    title: 'فرزندان بسر',
    value: false,
  },
];

const create = catchAsync(async (req, res) => {
  const { user_id } = req.body;

  const requestBody = {
    user_id: user_id,
    report: {
      ListOfIssues: ListOfIssues,
      ListOfCheckBox: ListOfCheckBox,
    },
    // user,
  };

  const newConsult = await consultService.createConsult({ body: requestBody });
  res.status(httpStatus.CREATED).send(newConsult);
});

const applyConsult = catchAsync(async (req, res) => {
  const { user_id, ListOfCheckBox, parent_mariage_type, mariage_type } = req.body;

  let newConsult = null;
  const isHaveIssues = ListOfCheckBox.some((val) => val.value == true);

  // check user
  // --------

  // check consult in DB
  const consultDoc = await consultService.getSpecificConsult({ id: req.params.consultId });

  if (!consultDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Consult Not Exist In DB');
  }

  // calculate and get
  // [result_reason]

  // IF parent_mariage_type === FAMILY && mariage_type === FAMILY
  // result will be =>  TRUE

  if (mariage_type === 'FAMILY' && parent_mariage_type === 'FAMILY') {
    consultDoc.consult.result_reason = 'RelationShip';
    consultDoc.consult.result = true;
    consultDoc.consult.ListOfCheckBox = ListOfCheckBox;

    newConsult = await consultDoc.consult.save();
    if (!newConsult) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Consult Could Not Update Result');
    }
    // IF In ListOfCheckBox we have issue
  } else if (isHaveIssues) {
    consultDoc.consult.result_reason = 'Have_Issues';
    consultDoc.consult.result = true;
    consultDoc.consult.report.ListOfCheckBox = ListOfCheckBox;

    newConsult = await consultDoc.consult.save();
    if (!newConsult) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Consult Could Not Update Result');
    }
  }

  res.status(httpStatus.CREATED).send(newConsult || consultDoc);
});



const getById = catchAsync(async (req, res) => {
  const consultDoc = await consultService.getSpecificConsult({
    id: req.params.consultId,
  });
  res.status(httpStatus.OK).send(consultDoc);
});

// const getAllReference = catchAsync(async (req, res) => {
//   const result = await referenceService.getAllReference({ query: req.query });
//   res.status(httpStatus.OK).send(result);
// });

// const getSpecificReference = catchAsync(async (req, res) => {
//   const result = await referenceService.getSpecificReference({
//     customer: req.query.customer,
//     reference_id: req.params.reference_id,
//   });
//   res.status(httpStatus.OK).send(result);
// });

// const createReference = catchAsync(async (req, res) => {
//   const newReference = await referenceService.createReference({ referenceBody: req.body });
//   res.status(httpStatus.CREATED).send(newReference);
// });

module.exports = {
  create,
  applyConsult,
  getById,
};
