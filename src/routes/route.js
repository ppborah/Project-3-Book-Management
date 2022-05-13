const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const bookController = require("../controllers/bookController");
const reviewController = require("../controllers/reviewController");
const middleware = require("../middleware/auth");

//*****Api for creating user*****//
router.post("/user", userController.registerUser);

//*****Api for login user*****//
router.post("/login", userController.loginUser);

//*****Api for posting books******//
router.post(
  "/books",
  middleware.authentication,
  middleware.authorisation,
  bookController.createBook
);

//*****Api for getting books by query params*****//
router.get("/books", middleware.authentication, bookController.getBooks);

//*****Api for getting books by userId in path params******//
router.get(
  "/books/:userId",
  middleware.authentication,
  bookController.getBooksById
);

//*****Api for updating books by bookId in path params******//
router.put(
  "/books/:bookId",
  middleware.authentication,
  middleware.authorisation,
  bookController.updateBook
);

//*****Api for deleting books by bookId in path params******//
router.delete(
  "/books/:bookId",
  middleware.authentication,
  middleware.authorisation,
  bookController.deleteBook
);

//*****Api for posting review  by bookId in path params******//
router.post("/books/:bookId/review", reviewController.createReview);

//*****Api for updating review  by bookId and review id in path params******//
router.post("/books/:bookId/review/:reviewId", reviewController.createReview);

//*****Api for deleting review  by bookId and review id in path params******//
router.post("/books/:bookId/review/:reviewId", reviewController.createReview);

router.delete("/books/:bookId/review/:reviewId", reviewController.deleteReview);

module.exports = router;
// if api is invalid OR wrong URL
router.all("/*", function (req, res) {
  res
    .status(404)
    .send({ status: false, msg: "The api you requested is not available" });
});

module.exports = router;
