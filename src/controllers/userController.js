const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");

//------------------------------------------------------------------------------------------------------------------------------------------------------

const registerUser = async function (req, res) {
  try {
    // data sent through request body
    let data = req.body;

    // function to validate empty spaces
    function onlySpaces(str) {
      return /^\s*$/.test(str);
    }

    // VALIDATIONS:

    // title validation
    let enumArr = ["Mr", "Mrs", "Miss"];
    if (!data.title) {
      return res
        .status(400)
        .send({ status: false, msg: " Please enter title(required field)" });
    } else if (onlySpaces(data.title) == true) {
      return res
        .status(400)
        .send({ status: false, msg: "title cannot be a empty" });
    } else if (!enumArr.includes(data.title)) {
      return res
        .status(400)
        .send({ status: false, msg: "Please enter valid title" });
    }

    //   name: {string, mandatory},
    // name validation
    if (!data.name) {
      return res
        .status(400)
        .send({ status: false, msg: "Please enter name(required field) " });
    } else if (onlySpaces(data.name) == true) {
      return res
        .status(400)
        .send({ status: false, msg: "name cannot be a empty" });
    } else if (!isNaN(data.name)) {
      return res
        .status(400)
        .send({ status: false, msg: "name cannot be a number" });
    }

    // if phone is empty
    if (!data.phone)
      return res.status(400).send({
        status: false,
        msg: "Please enter the phone number(required field)",
      });
    // if phone is invalid
    if (!/^(\+\d{1,3}[- ]?)?\d{10}$/.test(data.phone))
      return res.status(400).send({
        status: false,
        msg: `${data.phone} is not a valid phone number; Please provide a valid phone number`,
      });
    // phone duplication check
    let phoneCheck = await userModel.findOne({
      phone: data.phone,
    });
    if (phoneCheck)
      return res
        .status(400)
        .send({ status: false, msg: "Phone number is already used!" });

    // email validation
    if (!data.email) {
      return res
        .status(400)
        .send({ status: false, msg: " Please Enter email(required field)" });
    } else if (onlySpaces(data.email) == true) {
      return res
        .status(400)
        .send({ status: false, msg: "email cannot be a empty" });
    } else if (data.email) {
      let check = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
        data.email
      );
      if (!check) {
        return res
          .status(400)
          .send({ status: false, msg: " Please enter valid emailid" });
      }
      // MANIPULATE THE EMAIL TO MAKE IT SMALLCASE
      if (!(data.email === String(data.email).toLowerCase())) {
        return res.status(400).send({
          status: false,
          msg: "Capital letters are not allowed in emailid",
        });
      }
    }
    // email duplication check
    let emaildb = await userModel.findOne(
      { email: data.email },
      { email: 1, _id: 0 }
    );
    if (emaildb) {
      return res.status(400).send({
        status: false,
        msg: "We are sorry; this email is already registered",
      });
    }

    // password validation
    let pwd = data.password;
    if (!pwd) {
      return res
        .status(400)
        .send({ status: false, msg: " Please enter password(required field)" });
    }
    // if password has blank space in start/end
    else if ([pwd[0], pwd[pwd.length]].includes("")) {
      return res.status(400).send({
        status: false,
        msg: "Your password can't start or end with a blank space",
      });
    }
    //password length validation
    else if (!(8 < pwd.length < 15)) {
      let operator = "";
      if (pwd.length < 8) operator = "less than 8 characters";
      else if (pwd.length > 15) operator = "greater than 15 characters";
      return res
        .status(400)
        .send({ status: false, msg: `Password length cannot be ${operator}` });
    }

    // street has only whitespace characters
    if (onlySpaces(data.address?.street) === true) {
      return res.status(400).send({ status: false, msg: "street is invalid" });
    }

    // city has only whitespace characters
    if (onlySpaces(data.address?.city) === true) {
      return res.status(400).send({ status: false, msg: "city is invalid" });
    }

    // PIN code validation
    if (!/^[1-9]{1}[0-9]{2}\s?[0-9]{3}$/.test(data.address.pincode)) {
      return res
        .status(400)
        .send({ status: false, msg: "Please enter valid PIN code" });
    }

    // creating user
    let savedData = await userModel.create(data);

    // response
    res.status(201).send({ status: true, msg: savedData });
  } catch (err) {
    res.status(500).send({
      status: false,
      msg: "Internal Server Error",
      error: err.message,
    });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

const loginUser = async function (req, res) {
  try {
    // login credentials sent through request body
    let email = req.body.email;
    let password = req.body.password;

    // user document satisfying the login credentials
    let loginCredentials = await userModel.findOne({
      email: email,
      password: password,
    });

    // if login credentials are not correct
    if (!loginCredentials)
      return res.status(400).send({
        status: false,
        error: "email or password is incorrect",
      });

    // JWT generation using sign function
    let token = jwt.sign(
      {
        email: loginCredentials.email.toString(),
        userId: loginCredentials._id,
      },
      "Group14",
      {
        expiresIn: "24h",
      }
    );

    // JWT generated sent back in response header
    res.setHeader("x-api-key", token);

    res.status(200).send({
      status: true,
      msg: "Login Successfull! Token sent in header 'x-api-key'",
    });
  } catch (err) {
    res.status(500).send({
      status: false,
      msg: "Internal Server Error",
      error: err.message,
    });
  }
};

module.exports = { registerUser, loginUser };
