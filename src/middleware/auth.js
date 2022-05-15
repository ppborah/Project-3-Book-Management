const jwt = require("jsonwebtoken");
const bookModel = require("../models/bookModel");
const { isValidObjectId } = require("../validator/validation");

//------------------------------------------------------------------------------------------------------------------------------------------------------

const authentication = async function (req, res, next) {
  try {
    // token sent in request header 'x-api-key'
    token = req.headers["x-api-key"];

    // if token is not provided
    if (!token) {
      return res.status(400).send({ status: false, msg: "Token required! Please login to generate token" });
    }

    jwt.verify(token, "Group14", { ignoreExpiration: true }, function (error, decodedToken) {
      // if token is not valid
      if (error) {
        return res.status(400).send({ status: false, msg: "Token is invalid!" });

        // if token is valid
      } else {
        // checking if token session expired
        if (Date.now() > decodedToken.exp * 1000) {
          return res.status(401).send({ status: false, msg: "Session Expired" });
        }
        //exposing decoded token userId in request for everywhere access
        req.userId = decodedToken.userId;
        next();

      }
    }
    )

  } catch (err) {
    res.status(500).send({ msg: "Internal Server Error", error: err.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

const authorisation = async function (req, res, next) {
  try {
    // bookId sent through path params
    let bookId = req.params.bookId;

    // CASE-1: bookId is empty
    if (bookId === ":bookId") {
      return res
        .status(400)
        .send({ status: false, msg: "Please enter bookId to proceed!" });
    }
    // CASE-2: bookId is not an ObjectId
    else if (!isValidObjectId(bookId)) {
      return res.status(400).send({ status: false, msg: "bookId is invalid!" });
    }
    // CASE-3: bookId does not exist (in our database)
    let book = await bookModel.findOne({ _id: bookId }); // database call
    console.log(book);
    if (!book) {
      return res.status(400).send({
        status: false,
        msg: "We are sorry; Given bookId does not exist!",
      });
    }
    // CASE-4: bookId exists but is deleted (isDeleted: true)
    if (book && book.isDeleted) {
      return res.status(404).send({
        status: false,
        message: "We are sorry; Given bookId does not exist", // avoided | message: "bookId is deleted" | considering privacy (of user)
      });
    }

    // Authorisation: userId in token is compared with userId against bookId
    if (req.userId !== book.userId.toString()) {
      return res.status(401).send({
        status: false,
        msg: `Authorisation Failed! You are logged in ${req.userId} not as ${book.userId}`,
      });
    } else if (req.userId === book.userId.toString()) {
      next();
    }
  } catch (err) {
    res.status(500).send({ msg: "Internal Server Error", error: err.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports = { authentication, authorisation };
