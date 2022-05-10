// mandatory string validation
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
  if (pattern.test(pincode) === false) {
    return false;
  }
  return true;
};

//password validation
const isValidPassword = function (password) {
  if (!(8 < password.length < 15)) {
    return false;
  }
  return true;
};

module.exports = {
  isValid,
  isValidEmail,
  isValidPhone,
  isValidPincode,
  isValidPassword,
};
