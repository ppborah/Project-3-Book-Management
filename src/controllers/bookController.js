const bookModel = require("../models/bookModel");
const {
  isValidReqBody,
  isValid,
  isValidObjectId,
  isValidRelAt,
  isValidISBN
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
    res.status(500).send({ status: false, message: "Internal Server Error", error: err.message });
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
    return res.status(500).send({ status: false, message: "Internal Server Error", error: err.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

let getBooksById = async (req, res) => {
  try {
    let bookId = req.params.bookId;
    if (!validator.isValid(bookId)) {
      res
        .ststus(400)
        .send({ status: true, message: "bookId is required in params" });
    }
    let findbook = await bookModel.findById(id).select({ _v: 0 })
    if (!findbook)
      return res
        .status(404)
        .send({ status: false, msg: `no book found by this BookID:${bookId}` });
    ;
    let reviews = await reviewModel.find({ _id: bookId, isDeleted: false });

    let booksWithReview = findbook.toObject()
    Object.assign(booksWithReview, { reviewsData: reviews })


    return res.status(200).send({
      status: true,
      message: "Books list",
      data: booksWithReview
    });

  } catch (err) {
    res.status(500).send({ status: false, data: err.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

const updateBook = async function (req, res) {
  try {
    // bookId sent through path params
    const bookId = req.params.bookId;

    // if path params is empty
    if (!isValidReqBody(bookId)) {
      return res
        .status(400)
        .send({ status: false, msg: "BookId is Required!" });
    }

    // checking ObjectId is comes in valid format or not
    if (!isValidObjectId(bookId)) {
      return res
        .status(400)
        .send({ status: false, msg: "BookId is not Valid!" });
    }

    // if bookId does not exist (in our database)
    const availableBook = await bookModel.findById(bookId);
    if (!availableBook) {
      return res.status(404).send({ status: false, msg: "Book Not Found!" });
    }

    // if document is already deleted
    if (availableBook.isDeleted === true) {
      return res
        .status(404)
        .send({ status: false, msg: "Book already deleted!" });
    }

    // if document not deleted then user can update the book details
    if (availableBook.isDeleted === false) {
      // only same user can update book details
      if (availableBook.userId != req.userId) {
        return res
          .status(403)
          .send({ status: false, message: "Unauthorized access!" });
      }

      // book details sent through request body
      const bodyFromReq = req.body;

      // if request body is empty
      if (!isValidReqBody(bodyFromReq)) {
        return res.status(400).send({
          status: false,
          msg: "Please provide book details to update!",
        });
      }

      // update fields sent through request body
      const { title, excerpt, releasedAt, ISBN } = bodyFromReq;

      // if title is present in req checking through hasOwnProperty
      if (bodyFromReq.hasOwnProperty("title")) {
        // if title is empty
        if (!isValid(title)) {
          return res
            .status(400)
            .send({ status: false, msg: "title is not valid!" });
        }
        // title duplication check
        const isPresentTitle = await bookModel.findOne({ title: title });
        if (isPresentTitle) {
          return res.status(400).send({
            status: false,
            message: `${title.trim()} is already exists.Please try a new title.`,
          });
        }
      }

      // if excerpt is present in req checking through hasOwnProperty
      if (bodyFromReq.hasOwnProperty("excerpt")) {
        // if excerpt is empty
        if (!isValid(excerpt)) {
          return res
            .status(400)
            .send({ status: false, msg: "excerpt is not valid!" });
        }
      }

      // if releasedAt is present in req checking through hasOwnProperty
      if (bodyFromReq.hasOwnProperty("releasedAt")) {
        // if releasedAt is empty or invalid format
        if (!isValidRelAt(releasedAt)) {
          return res
            .status(400)
            .send({ status: false, msg: "releasedAt is not valid.Please use (YYYY-MM-DD) format" });
        }
      }

      // if ISBN is present in req checking through hasOwnProperty
      if (bodyFromReq.hasOwnProperty("ISBN")) {
        // if ISBN is empty or invalid format
        if (!isValidISBN(ISBN)) {
          return res
            .status(400)
            .send({ status: false, msg: "ISBN is not valid.Please use 10 or 13 digits ISBN format" });
        }
        // ISBN duplication check
        const isPresent_ISBN = await bookModel.findOne({ ISBN: ISBN });
        if (isPresent_ISBN) {
          return res.status(400).send({
            status: false,
            message: `${ISBN.trim()} is already registered.`,
          });
        }

      }

      //updating book details
      const updatedBook = await bookModel.findOneAndUpdate(
        { _id: bookId },
        { ...bodyFromReq },
        { new: true }
      );
      return res.status(200).send({ status: true, data: updatedBook });
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
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
