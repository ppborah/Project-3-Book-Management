const mongoose = require("mongoose");

// request body validation (required: true)
const isValidReqBody = function (reqbody) {
  if (!Object.keys(reqbody).length) {
    return false;
  }
  return true;
};

// string validation (required: true)
const isValid = function (value) {
  if (typeof value === "undefined" || typeof value === null) return false;
  if (typeof value === "string" && value.trim().length == 0) return false;
  return true;
};

// email validation
const isValidEmail = function (email) {
  const pattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return pattern.test(email); // returns a boolean
};

// phone validation
const isValidPhone = function (phone) {
  const pattern = /^(\+\d{1,3}[- ]?)?\d{10}$/;
  return pattern.test(phone); // returns a boolean
};

// pincode validation
const isValidPincode = function (pincode) {
  const pattern = /^[1-9]{1}[0-9]{2}\s?[0-9]{3}$/;
  return pattern.test(pincode); // returns a boolean
};

//password validation
const isValidPassword = function (password) {
  if (!(8 < password.length < 15)) {
    return false;
  }
  return true;
};

// ObjectId validation
const isValidObjectId = function (objectId) {
  return mongoose.Types.ObjectId.isValid(objectId); // returns a boolean
};

// ISBN validation
const isValidISBN = function (ISBN) {
  const pattern = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;
  return pattern.test(ISBN); // returns a boolean
};

// releasedAt validation
const isValidRelAt = function (releasedAt) {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  return pattern.test(releasedAt); // returns a boolean
};

module.exports = {
  isValidReqBody,
  isValid,
  isValidEmail,
  isValidPhone,
  isValidPincode,
  isValidPassword,
  isValidObjectId,
  isValidISBN,
  isValidRelAt,
};
