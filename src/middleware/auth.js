const jwt = require("jsonwebtoken");
const bookModel = require("../models/bookModel");
const mongoose = require("mongoose");

//------------------------------------------------------------------------------------------------------------------------------------------------------

const authentication = async function (req, res, next) {
  try {
    // token sent in request header 'x-api-key'
    token = req.headers["x-api-key"];

    // if token is not provided
    if (!token)
      return res.status(400).send({
        status: false,
        msg: "Token required! Please login to generate token",
      });

    // if token is invalid
    let decodedToken = jwt.verify(token, "Group14");
    if (!decodedToken)
      return res.status(401).send({ status: false, msg: "token is invalid" });

    // if token is valid
    req.userId = decodedToken.userId;

    next();
  } catch (err) {
    res.status(500).send({ msg: "Internal Server Error", error: err.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

const authorisation = async function (req, res, next) {
  try {
    // bookId sent through path variable
    let bookId = req.params.bookId;

    // CASE-1: bookId is empty
    if (bookId === ":bookId") {
      return res
        .status(400)
        .send({ status: false, msg: "Please enter bookId to proceed!" });
    }
    // CASE-2: bookId is not an ObjectId
    else if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).send({ status: false, msg: "bookId is invalid!" });
    }
    // CASE-3: bookId is not present in the database
    let book = await bookModel
      .findOne({ _id: bookId })
      .select({ userId: 1, _id: 0 });
    if (!book) {
      return res.status(400).send({
        status: false,
        msg: "We are sorry; Given bookId does not exist!",
      });
    }

    // Authorisation: userId in token is compared with userId against bookId
    if (req.userId !== book.userId.toString()) {
      return res
        .status(401)
        .send({ status: false, msg: "Authorisation Failed!" });
    } else if (req.userId === book.userId.toString()) {
      next();
    }
  } catch (err) {
    res.status(500).send({ msg: "Internal Server Error", error: err.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports = { authentication, authorisation };
