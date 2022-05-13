const bookModel = require('../models/bookModel');
const reviewModel = require("../models/reviewModel");
const {
  isValidReqBody,
  isValid,
  isValidObjectId,
  isValidRelAt,
  isValidISBN,
  isValidRating,
} = require("../validator/validation");

//create review function

const createReview = async function (req, res) {
  try {
    //taking data in request body by the user
    const reviewData = req.body;

    //taking bookId in path params of which user want to review 
    const bookId = req.params.bookId;

    //checking for valid objectId (bookId) given by user i.e. 24 byte
    if (!isValidObjectId(bookId)) {
      return res.status(400).send({ status: false, message: "You are entering invalid bookId. It should be of 24 byte" })
    }

    //destructuring data of request body
    const { reviewedBy, rating, review } = reviewData;

    //finding book by bookId in book collection
    const isValidBookId = await bookModel.findOne({ _id : bookId , isDeleted : false,});
    
    //CASE:1-if no book found
    if (!isValidBookId) {
      return res.status(404).send({ status: false, msg: "no book available." });
    }
    
    //CASE:2-if book is available with bookId
    //checking for if user is giving reviewedBy property in request body
    if (reviewData.hasOwnProperty('reviewedBy')) {
      if (!isValid(reviewedBy)) {
        return res.status(400).send({ status: false, message: "reviewedBy should be in valid format" })
      }
    }

    //checking for if user is giving reviewe property in request body
    if (reviewData.hasOwnProperty('review')) {
      if (!isValid(review)) {
        return res.status(400).send({ status: false, msg: "plesae give a valid  book review" }); //review is must
      }

    }
    
    //useing new Date function to get same date at which the review is posted with time
    const releasedDate = new Date()
    
    //CASE:1-checking for mandatory field rating
    if (!isValid(rating)) {
      return res.status(400).send({ status: false, message: "plesae gives rating" }); // rating is must
    }
    
    //CASE:2-check if rating is between minimun or maximum value
    if (!isValidRating(rating)) {
      return res.status(400).send({ status: false, message: "You have to give rating between 1 to 5 (1 or 5 is included)" })
    }
    
    //destructuring response body(the property we want send to view in response)
    const responseBody = { bookId: bookId, reviewedBy: reviewedBy, rating: rating, reviewedAt: releasedDate };

    //creating review
    const reviewCreated = await reviewModel.create(responseBody);

    //finding that created review with reviewId
    const findReviewId = await reviewModel.findById(reviewCreated._id).select({ isDeleted: 0, createdAt: 0, updatedAt: 0, __v: 0, })
    
    //sending rersponse
    res.status(201).send({ status: true, message: "Review created successfully", data: findReviewId });
    
    //finding book with bookId and updting its review count
    const udatedBookReview = await bookModel.findOneAndUpdate(
      { _id: bookId },
      { $inc: { reviews: 1 } }
    );
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};


//delete review function
const deleteReview = async function (req, res) {
  try {
    reviewId = req.params.reviewId;

    // if reviewId is not entered!
    if (reviewId === ":reviewId") {
      return res.status(400).send({
        status: false,
        msg: "Please enter reviewId",
      });
    }

    let reviews = await reviewModel.find({ _id: reviewId });

    // if review does not exist in our database
    if (reviews.length === 0) {
      return res.status(400).send({
        status: false,
        msg: "review does not exist",
      });
    }

    // if review exists in our database
    // CASE-1: isDeleted: true
    if (reviews.isDeleted === true) {
      return res.status(400).send({
        status: false,
        msg: "review does not exist",
      });
    }
    // CASE-2: isDeleted: false
    if (reviews.isDeleted === false) {
      await reviewModel.findOneAndUpdate(
        { _id: reviewId },
        {
          isDeleted: true,
        }
      );
      return res.status(200).send({
        status: true,
        msg: "Deletion successful",
      });
    }
  } catch (err) {
    res.status(500).send({
      status: false,
      msg: "Internal Server Error",
      error: err.message,
    });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports = { createReview, deleteReview };
