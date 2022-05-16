const { default: mongoose } = require("mongoose");
const bookModel = require("../models/bookModel");
const reviewModel = require("../models/reviewModel");
const {
  isValidReqBody,
  isValid,
  isValidObjectId,
  isValidRelAt,
  isValidISBN,
  isValidRating,
  isValidName,
} = require("../validator/validation");
const ObjectId = mongoose.Types.ObjectId;

//create review function

const createReview = async function (req, res) {
  try {
    //taking data in request body by the user
    const reviewData = req.body;
    // if request body is empty
    if (!isValidReqBody(reviewData)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide the book details" });
    }

    //taking bookId in path params of which user want to review
    const bookId = req.params.bookId;

    //checking for valid objectId (bookId) given by user i.e. 24 byte
    if (!isValidObjectId(bookId)) {
      return res.status(400).send({
        status: false,
        message: "You are entering invalid bookId. It should be of 24 byte",
      });
    }

    //destructuring data of request body
    const { reviewedBy, rating, review } = reviewData;

    //finding book by bookId in book collection
    const isValidBookId = await bookModel.findOne({
      _id: bookId,
      isDeleted: false,
    });

    //CASE:1-if no book found
    if (!isValidBookId) {
      return res
        .status(404)
        .send({ status: false, message: "no book available." });
    }

    //CASE:2-if book is available with bookId
    //checking for if user is giving reviewedBy property in request body
    if (reviewData.hasOwnProperty("reviewedBy")) {
      if (!isValid(reviewedBy)) {
        return res.status(400).send({
          status: false,
          message: "reviewedBy should be in valid format",
        });
      }
      if (!isValidName(reviewedBy)) {
        return res
          .status(400)
          .send({ status: false, message: "plesae give a valid reviewedBy name" });
      }
    }

    //checking for if user is giving reviewe property in request body
    if (reviewData.hasOwnProperty("review")) {
      if (!isValid(review)) {
        return res
          .status(400)
          .send({ status: false, message: "plesae give a valid  book review" }); //review is must
      }
    }

    //useing new Date function to get same date at which the review is posted with time
    const releasedDate = new Date();
    
    if(!rating){
      return res.status(400).send({ status:false , message: "please provide rating"})
    }
    //check if rating is between minimun or maximum value
    if (!isValidRating(rating)) {
      return res.status(400).send({
        status: false,
        message: "You have to give rating between 1 to 5 (1 or 5 is included)",
      });
    }

    //destructuring response body(the property we want send to view in response)
    const responseBody = {
      bookId: bookId,
      reviewedBy: reviewedBy,
      rating: rating,
      reviewedAt: releasedDate,
      review: review,
    };

    //creating review
    const reviewCreated = await reviewModel.create(responseBody);

    //finding that created review with reviewId
    const findReviewId = await reviewModel
      .findById(reviewCreated._id)
      .select({ isDeleted: 0, createdAt: 0, updatedAt: 0, __v: 0 });

    //sending rersponse
    res.status(201).send({
      status: true,
      message: "Review created successfully",
      data: findReviewId,
    });

    //finding book with bookId and updting its review count
    const udatedBookReview = await bookModel.findOneAndUpdate(
      { _id: bookId },
      { $inc: { reviews: 1 } }
    );
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

//update review function
const reviewUpdate = async function (req, res) {
  try {
    const bookId = req.params.bookId;
    const reviewId = req.params.reviewId;

    //ojectId validation
    if (!isValidObjectId(bookId)) {
      return res
        .status(400)
        .send({ status: false, msg: "bookId is not valid!" });
    }

    //objectId validation
    if (!isValidObjectId(reviewId)) {
      return res
        .status(400)
        .send({ status: false, msg: "reviewId is not valid!" });
    }

    //Finding book by bookId
    const availableBook = await bookModel.findOne({
      _id: bookId,
      isDeleted: false,
    });
    if (!availableBook) {
      return res.status(404).send({ status: false, msg: "Book Not Found!" });
    }

    //finding review by reviewid
    const availableReview = await reviewModel.findOne({
      _id: reviewId,
      isDeleted: false,
    });
    if (!availableReview) {
      return res.status(404).send({ status: false, msg: "Review Not Found!" });
    }

    //checkingis review's bookId is same as of given bookId
    if (availableReview.bookId != bookId) {
      return res
        .status(403)
        .send({ status: false, message: "review is not from this book!" });
    }
    //taking data in request body for updation
    const bodyFromReq = req.body;

    if (!isValidReqBody(bodyFromReq)) {
      return res.status(400).send({
        status: false,
        msg: "Please provide review details to update!",
      });
    }

    const { reviewedBy, review, rating } = bodyFromReq;

    //hasOwnProperty will check if request body has that property or not
    if (bodyFromReq.hasOwnProperty("reviewedBy")) {
      if (!isValid(reviewedBy)) {
        return res
          .status(400)
          .send({ status: false, msg: "reviewedBy is not valid!" });
      }
      if (!isValidName(reviewedBy)) {
        return res
          .status(400)
          .send({ status: false, msg: "plesae give a valid reviewedBy name" });
      }
    }

    if (bodyFromReq.hasOwnProperty("review")) {
      if (!isValid(review)) {
        return res
          .status(400)
          .send({ status: false, msg: "review is not valid!" });
      }
    }

    if (bodyFromReq.hasOwnProperty("rating")) {
      if (!isValidRating(rating)) {
        return res
          .status(400)
          .send({ status: false, msg: "rating is not valid!" });
      }
    }

    //updating review
    const updatedReview = await reviewModel.findOneAndUpdate(
      { _id: reviewId },
      { ...bodyFromReq },
      { new: true }
    );

    const allAvailableReviews = await reviewModel.find({
      bookId: bookId,
      isDeleted: false,
    });

    //setting a new key in review object
    let availableBook1 = availableBook.toJSON();
    availableBook1.reviewData = allAvailableReviews;

    return res.status(200).send({ status: true, data: availableBook1 });
  } catch (err) {
    return res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
//------------------------------------------------------------------------------------------------------------------------------------------------------

//delete review function
const deleteReview = async function (req, res) {
  try {
    // reviewId & bookId sent through path params
    const reviewId = req.params.reviewId;
    const bookId = req.params.bookId;

    // CASE-1: if reviewId is not a valid ObjectId
    if (!isValidObjectId(reviewId)) {
      return res.status(400).send({
        status: false,
        message: "reviewId is not a valid ObjectId",
      });
    }

    // CASE-2: if reviewId does not exist (in database)
    let review = await reviewModel.findOne({ _id: reviewId }); // database call (reviewModel)
    if (!review) {
      return res.status(404).send({
        status: false,
        message: "review does not exist",
      });
    }

    // CASE-3: if isDeleted: true for review document
    if (review.isDeleted === true) {
      return res.status(404).send({
        status: false,
        message: "review does not exist",
      });
    }

    // CASE-4: if bookId is not a valid ObjectId
    if (!isValidObjectId(bookId)) {
      return res.status(400).send({
        status: false,
        message: "bookId is not a valid ObjectId",
      });
    }

    // CASE-5: if bookId ( in review document) does not exist (in database)
    let book = await bookModel.findOne({ _id: review.bookId }); // database call (bookModel)
    if (!book) {
      return res.status(404).send({
        status: false,
        message: "book does not exist",
      });
    }

    // CASE-6: if isDeleted: true for book document
    if (book.isDeleted === true) {
      return res.status(404).send({
        status: false,
        message: "book does not exist",
      });
    }

    // CASE-7: Both reviewId, bookId exist in database && isDeleted: false
    if (review.isDeleted === false && book.isDeleted === false) {
      if (review.bookId.toString() !== bookId) {
        return res.status(400).send({
          status: false,
          message: `review is not from ${book.title}`,
        });
      }
      // database call (reviewModel)
      await reviewModel.findOneAndUpdate(
        { _id: reviewId },
        {
          $set: { isDeleted: true },
        }
      );
      // decrementing reviews count
      book.reviews--;
      await book.save();
      // response
      return res.status(200).send({
        status: true,
        message: "Deletion successful",
      });
    }

    // Bad request
    res.status(400).send({
      status: false,
      message: "Bad Request",
    });
  } catch (err) {
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports = { createReview, reviewUpdate, deleteReview };
