const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const bookController = require("../controllers/bookController");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

router.post("/books", bookController.createBook);
router.get("/books", bookController.getBooks);
router.get("/books/:bookId", bookController.getBooksById);
router.put("/books/:bookId", bookController.updateBook);




// if api is invalid OR wrong URL
router.all("/*", function (req, res) {
  res
    .status(404)
    .send({ status: false, msg: "The api you requested is not available" });
});

module.exports = router;
