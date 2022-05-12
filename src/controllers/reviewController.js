const reviewModel = require("../models/reviewModel");

//------------------------------------------------------------------------------------------------------------------------------------------------------

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

module.exports = { deleteReview };
