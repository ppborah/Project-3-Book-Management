const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const bookController = require("../controllers/bookController");
const middleware = require("../middleware/auth");

router.post("/register", userController.registerUser); // user registration
router.post("/login", userController.loginUser); // user login

router.post("/books", middleware.authentication, bookController.createBook); // book creation
router.get("/books", middleware.authentication, bookController.getBooks);
router.get(
  "/books/:bookId",
  middleware.authentication,
  bookController.getBooksById
);
router.put(
  "/books/:bookId",
  middleware.authentication,
  middleware.authorisation,
  bookController.updateBook
);
router.delete(
  "/books/:bookId",
  middleware.authentication,
  middleware.authorisation,
  bookController.deleteBook
);

// if api is invalid OR wrong URL
router.all("/*", function (req, res) {
  res
    .status(404)
    .send({ status: false, msg: "The api you requested is not available" });
});

module.exports = router;
