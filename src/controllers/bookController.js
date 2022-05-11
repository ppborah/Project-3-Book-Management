const bookModel = require("../models/bookModel");
const {
  isValidReqBody,
  isValid,
  isValidObjectId,
  isValidRelAt,
} = require("../validator/validation");
const userModel = require("../models/userModel");
const reviewModel = require("../models/reviewModel");

//------------------------------------------------------------------------------------------------------------------------------------------------------

const createBook = async function (req, res) {
  try {
    // book details sent through request body
    const data = req.body;

    const {
      title,
      excerpt,
      userId,
      ISBN,
      category,
      subcategory,
      isDeleted,
      releasedAt,
    } = data;

    // VALIDATIONS:

    // if request body is empty
    if (!isValidReqBody(data)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide the book details" });
    }

    // if title is empty
    if (!isValid(title)) {
      return res.status(400).send({
        status: false,
        message: "Please provide the title (required field)",
      });
    }
    // title duplication check
    const isDuplicateTitle = await bookModel.findOne({ title: title });
    if (isDuplicateTitle) {
      return res
        .status(400)
        .send({ status: false, message: "Title is already used!" });
    }

    // if excerpt is empty
    if (!isValid(excerpt)) {
      return res.status(400).send({
        status: false,
        message: "Please provide the excerpt (required field)",
      });
    }

    // if userId is empty
    if (!isValid(userId)) {
      return res.status(400).send({
        status: false,
        message: "Please enter userId (required field)",
      });
    }
    // if userId is invalid
    if (!isValidObjectId(userId)) {
      return res.status(400).send({
        status: false,
        message: "userId is invalid!",
      });
    }
    // if userId does not exist (in our database)
    const userIdInDB = await userModel.findById(userId);
    if (!userIdInDB) {
      return res
        .status(404)
        .send({ status: false, message: "UserId does not exist" });
    }
    // 📌 AUTHORISATION: if userId (in token) !== userId (in req.body)
    if (userId !== req.userId) {
      return res.status(401).send({
        status: false,
        message: `Authorisation Failed: You are logged in as ${req.userId} not ${userId}`,
      });
    }

    // if ISBN is empty
    if (!isValid(ISBN)) {
      return res.status(400).send({
        status: false,
        message: "Please provide the ISBN (required field)",
      });
    }
    // ISBN duplication check
    const isDuplicateISBN = await bookModel.findOne({ ISBN: ISBN });
    if (isDuplicateISBN) {
      return res
        .status(400)
        .send({ status: false, message: "ISBN is already used!" });
    }

    // if category is empty
    if (!isValid(category)) {
      return res.status(400).send({
        status: false,
        message: "Please provide the category (required field)",
      });
    }

    // if subcategory is empty
    if (!isValid(subcategory)) {
      return res.status(400).send({
        status: false,
        message: "Please provide the subcategory (required field)",
      });
    }

    // if releasedAt is empty
    if (!isValid(releasedAt)) {
      return res.status(400).send({
        status: false,
        message: "Please provide the book release date (required field).",
      });
    }
    // if releasedAt is invalid (format)
    if (!isValidRelAt(releasedAt)) {
      return res.status(400).send({
        status: false,
        message: "Please follow the format YYYY-MM-DD for book release date",
      });
    }

    // if "isDeleted": true
    if (isDeleted) {
      return res.status(400).send({
        status: false,
        message: "isDeleted cannot be true during creation!",
      });
    }

    // if deletedAt is entered
    delete data.deletedAt;

    //creating book
    const createdBook = await bookModel.create(data);

    // response
    res.status(201).send({
      status: true,
      message: "Sucess",
      data: createdBook,
    });
  } catch (err) {
    res.status(500).send({ msg: "Internal Server Error", error: err.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

let getBooks = async function (req, res) {
  try {
    // filters sent through query params
    const { userId, category, subcategory } = req.query;

    // if userId is entered
    if (isValid(userId)) {
      // if userId is invalid
      if (!isValidObjectId(userId)) {
        return res.status(400).send({
          status: false,
          msg: "userId is invalid!",
        });
      }
      // if userId does not exist (in our database)
      const userIdInDB = await userModel.findById(userId);
      if (!userIdInDB) {
        return res
          .status(404)
          .send({ status: true, msg: "UserId does not exist" });
      }
    }

    //Array containing query params as objects
    let filtersArr = [
      { userId: userId?.trim() },
      { category: category?.trim() },
      { subcategory: subcategory?.trim() },
    ];

    // filtersArr MANIPULATION:  if an object's "value" === "" or undefined, then, that object is eliminated altogether from filtersArr
    for (let i = 0; i < filtersArr.length; i++) {
      let x = filtersArr[i];

      // object's value is required --> Object.values✅ | dot notation❌ (Reason: key is unknown)
      valueArr = Object.values(x);

      // valueArr is of the form: [value of x Object]
      if (!valueArr[0]) {
        filtersArr.splice(i, 1);
        i--;
      }
    }

    // deleted books should not be accessible
    filtersArr.push({ isDeleted: false });

    // aggregation pipeline using $match, $project & $sort to get desired result
    let filteredBooks = await bookModel.aggregate([
      {
        $match: { $and: filtersArr },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          excerpt: 1,
          userId: 1,
          category: 1,
          reviews: 1,
          releasedAt: 1,
        },
      },
      {
        $sort: { title: 1 },
      },
    ]);

      // CASE-1: if isDeleted: true for all existing books / no book exists (in the database)
    if (!filteredBooks.length) {
      return res.status(404).send({
        status: false,
        msg: "No book exists",
      });
    }

    // CASE-2: if no book satisfies given filters
    if (!filteredBooks.length && filtersArr.length !== 1) {
      return res.status(404).send({
        status: false,
        msg: "No book satisfies the given filters!",
      });
    }

    // CASE-3: if atleast one book satisfies given filter(s) --> if no filters entered(SUBCASE): "string interpolation" used for relevant msg
    let noFilter = "";
    if (filtersArr.length === 1) {
      noFilter = "(No filters applied!)"; // if no filters entered
    }
    // response
    res.status(200).send({
      status: true,
      msg: `Books list${noFilter}`,
      data: filteredBooks,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

let getBooksById = async (req, res) => {
  try {
    let data = req.params;
    if (!validator.isValid(data)) {
      res
        .ststus(400)
        .send({ status: true, message: "userId is required in params" });
    }
    let id = data.userId;
    if (id) {
      let findbook = await bookModel.findById(id).catch((err) => null);
      if (!findbook)
        return res
          .status(404)
          .send({ status: false, msg: `no book found by this BookID:${id}` });

      let bookid = findbook._id;
      let reviews = await reviewModel.find({ _id: bookid, isDeleted: false });

      return res.status(200).send({
        status: true,
        message: "Books list",
        data: findbook,
        reviewsData: reviews,
      });
    }
  } catch (err) {
    res.status(500).send({ status: false, data: err.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

const updateBook = async function (req, res) {
  try {
    const bookId = req.params.bookId;
    if (Object.keys(bookId).length == 0) {
      return res
        .status(400)
        .send({ status: false, msg: "BookId is Required!" });
    }

    if (!validator.isValidObjectId(bookId)) {
      return res
        .status(400)
        .send({ status: false, msg: "BookId is not Valid!" });
    }

    const availableBook = await bookModel.findById(bookId);
    if (!availableBook) {
      return res.status(404).send({ status: false, msg: "Book Not Found!" });
    }

    if (availableBook.isDeleted === true) {
      return res
        .status(404)
        .send({ status: false, msg: "Book already deleted!" });
    }

    if (availableBook.isDeleted === false) {
      if (availableBook.userId != req.userId) {
        return res
          .status(403)
          .send({ status: false, message: "Unauthorized access!" });
      }

      const updateDetails = req.body;
      if (!validator.isValidReqBody(updateDetails)) {
        return res.status(400).send({
          status: false,
          msg: "Please provide book details to update!",
        });
      }

      const { title, excerpt, releasedAt, ISBN } = updateDetails;

      if (!validator.isValid(title)) {
        return res
          .status(400)
          .send({ status: false, msg: "title is not valid!" });
      }

      const isPresentTitle = await bookModel.findOne({ title: title });
      if (isPresentTitle) {
        return res.status(400).send({
          status: false,
          message: `${title.trim()} is already exists.Please try a new title.`,
        });
      }

      if (!validator.isValid(excerpt)) {
        return res
          .status(400)
          .send({ status: false, msg: "excerpt is not valid!" });
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(releasedAt)) {
        return res
          .status(400)
          .send({ status: false, msg: "releasedAt is not valid!" });
      }

      if (!validator.isValidISBN(ISBN)) {
        return res
          .status(400)
          .send({ status: false, msg: "ISBN is not valid!" });
      }

      const isPresent_ISBN = await bookModel.findOne({ ISBN: ISBN });
      if (isPresent_ISBN) {
        return res.status(400).send({
          status: false,
          message: `${ISBN.trim()} is already registered.`,
        });
      }

      const updatedBook = await bookModel.findOneAndUpdate(
        { _id: bookId },
        { title: title, excerpt: excerpt, releasedAt: releasedAt, ISBN: ISBN },
        { new: true }
      );
      return res.status(200).send({ status: true, data: updatedBook });
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

const deleteBook = async function (req, res) {
  try {
    let bookId = req.params.bookId;

    // bookId VALIDATION: done in authorisation

    // "check" OBJECT will contain a key "isDeleted" and its value of the book document corresponding to the bookId
    let check = await bookModel.findOne(
      { _id: bookId },
      {
        isDeleted: 1,
        _id: 0,
      }
    );

    //CONDITIONS
    //CASE-1: bookId does not exist: validation already done in authorisation middleware

    //CASE-2: bookId exists but is deleted
    if (check && check.isDeleted) {
      return res.status(404).send({
        status: false,
        msg: "We are sorry; Given bookId does not exist", // Due to privacy concerns we are not telling that the blog is deleted
      });
    }

    //CASE-3: bookId exists but is not deleted
    else if (check && !check.isDeleted) {
      // deletion of blog using findOneAndUpdate
      await bookModel.findOneAndUpdate(
        {
          _id: bookId,
        },
        {
          isDeleted: true,
          deletedAt: new Date(), //deletedAt is added using Date() constructor
        }
      );
      return res.status(200).send({
        status: true,
        msg: "Deletion Successful",
      });
    }
  } catch (err) {
    res.status(500).send({ msg: "Internal Server Error", error: err.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports = { createBook, getBooks, getBooksById, updateBook, deleteBook };
