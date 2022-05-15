const bookModel = require("../models/bookModel");
const {
  isValidReqBody,
  isValid,
  isValidSubcategory,
  isValidObjectId,
  isValidRelAt,
  isValidISBN,
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
    // if ISBN is invalid
    if (!isValidISBN(ISBN)) {
      return res.status(400).send({
        status: false,
        message: "ISBN is invalid",
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

     // if subcategory is an array then validating each element
     if (Array.isArray(subcategory)) {
      for (let i = 0; i < subcategory.length; i++) {
        element = subcategory[i];
        if (!isValid(element)) {
          return res.status(400).send({
            status: false,
            message: 'subcategory is (required field) format like: ["Fiction","Classic"]',
          });
        }
      }
    }

    // if subcategory is empty
    if (!isValidSubcategory(subcategory)) {
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
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

let getBooks = async function (req, res) {
  try {
    //taking filter in query params
    let userQuery = req.query;

    //filtering the deleted data
    let filter = {
      isDeleted: false,
    };

    //checking if there is no filter in query params
    // if (!isValidReqBody(userQuery)) {
    //   return res.status(400).send({
    //     status: true,
    //     message: " Invalid parameters, please provide valid data",
    //   });
    // }

    //sending filter through query params
    const { userId, category, subcategory } = userQuery;

    //userId given by the user
    if (userId) {
      //checking for if userId if not valid
      if (!isValidObjectId(userId)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid userId" });
      }

      //if userId is valid
      if (isValid(userId)) {
        filter["userId"] = userId;
      }
    }

    //checking for if category is valid
    if (isValid(category)) {
      filter["category"] = category.trim();
    }

    //checking subcategory value for valid format (i.e.array of string in model)
    if (subcategory) {
      const subCategoryArray = subcategory
        .trim()
        .split(",")
        .map((s) => s.trim());
      filter["subcategory"] = { $all: subCategoryArray };
    }

    //finding books according to the query given by the user in query params
    let findBook = await bookModel.find(filter).select({
      title: 1,
      book_id: 1,
      excerpt: 1,
      userId: 1,
      category: 1,
      releasedAt: 1,
      reviews: 1,
    });

    //console.log(findBook);

    //checking is the findbook is an array and if its length is zero , means empty array
    if (findBook.length === 0) {
      return res
        .status(404)
        .send({ status: false, message: "Books Not Found" });
    }

    //Sorting of data of araay(findbook) by the title value
    const sortedBooks = findBook.sort((a, b) => a.title.localeCompare(b.title));

    //sending response of sortedBooks
    res
      .status(200)
      .send({ status: true, message: "Books list", data: sortedBooks });
  } catch (err) {
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

let getBooksById = async (req, res) => {
  try {
    //taking bookId from the user in Path Params
    let bookId = req.params.bookId;

    //If provided booikId is not valid!
    if (!isValidObjectId(bookId)) {
      return res
        .status(400)
        .send({ status: true, message: "bookId is required in params" });
    }

    //searching for book (document) with the bookId given by user
    let findbook = await bookModel.findById({_id:bookId}).select({ _v: 0 });

    //if no book found
    if (!findbook)
      return res.status(404).send({
        status: false,
        message: `no book found by this BookID: ${bookId}`,
      });

    //if that book is deleted
    if (findbook.isDeleted === true) {
      return res
        .status(404)
        .send({ status: false, message: "Book already deleted!" });
    }

    //finding reviews (in array) by bookId
    let reviews = await reviewModel.find({ bookId: bookId , isDeleted: false });
    console.log(reviews)

    //making a new object and adding a new field (reviewsData)
    let booksWithReview = findbook.toObject();
    Object.assign(booksWithReview, { reviewsData: reviews });
    console.log(booksWithReview)

    //sending successful response with new object
    return res.status(200).send({
      status: true,
      message: "Books list",
      data: booksWithReview,
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

    // bookId VALIDATIONS: handled by middleware

    // book details (to be updated) sent through request body
    const bodyFromReq = req.body;

    // if request body is empty
    if (!isValidReqBody(bodyFromReq)) {
      return res.status(400).send({
        status: false,
        message: "Please provide book details to update!",
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
          .send({ status: false, message: "title is not valid!" });
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
          .send({ status: false, message: "excerpt is not valid!" });
      }
    }

    // if releasedAt is present in req checking through hasOwnProperty
    if (bodyFromReq.hasOwnProperty("releasedAt")) {
      // if releasedAt is empty or invalid format
      if (!isValidRelAt(releasedAt)) {
        return res.status(400).send({
          status: false,
          message: "releasedAt is not valid.Please use (YYYY-MM-DD) format",
        });
      }
    }

    // if ISBN is present in req checking through hasOwnProperty
    if (bodyFromReq.hasOwnProperty("ISBN")) {
      // if ISBN is empty or invalid format
      if (!isValidISBN(ISBN)) {
        return res.status(400).send({
          status: false,
          message: "ISBN is not valid.Please use 10 or 13 digits ISBN format",
        });
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
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

const deleteBook = async function (req, res) {
  try {
    // bookId sent through path params
    let bookId = req.params.bookId;

    // bookId VALIDATION (handled by middleware)

    // CASES:
    // CASE-1: bookId does not exist (handled by middleware)
    // CASE-2: bookId exists but is deleted (handled by middleware)

    // CASE-3: bookId exists but is not deleted
    let check = await bookModel.findOne({ _id: bookId }); // database call
    if (check && !check.isDeleted) {
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
        message: "Deletion Successful",
      });
    }
  } catch (err) {
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

//------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports = { createBook, getBooks, getBooksById, updateBook, deleteBook };
