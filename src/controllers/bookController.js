const { default: mongoose } = require('mongoose');
const bookModel = require('../models/bookModel');
const validator = require("../validator/validation");
const userModel = require("../models/userModel");
const reviewModel = require("../models/reviewModel");





const createBook = async function (req, res) {
    try {
      const book = req.body;
  
      if (!validator.isValidReqBody(book)) {
        res
          .status(400)
          .send({ status: false, msg: "Please provide the Book details" }); //Validate the value that is provided by the Client.
      }
  
      const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = book;
        
  
      if (!validator.isValid(userId)) {
        return res.status(403).send({    /////status 403 unauthorize
          status: false,
          message: "Unauthorized access.",
        });
      }
  
      if (!validator.isValid(title)) {
        return res
          .status(400)    ///// status 400 for bad request
          .send({ status: false, msg: "Please provide the Title" }); //Title is Mandory
      }
  
      const isDuplicateTitle = await bookModel.findOne({ title: title });
      if (isDuplicateTitle) {
        return res
          .status(400)
          .send({ status: true, msg: "Title already exists." }); //Title is Unique
      }
  
      if (!validator.isValid(excerpt)) {
        return res
          .status(400)
          .send({ status: false, msg: "Please provide the excerpt" }); //Excerpt is Mandory
      }
  
      const isValidUserId = await userModel.findById(userId);
  
      if (!isValidUserId) {
        return res.status(404).send({ status: true, msg: "User not found." }); //find User in userModel
      }
  
      if (!validator.isValid(ISBN)) {
        return res
          .status(400)
          .send({ status: false, msg: "Please provide the ISBN" }); //ISBN is mandory
      }
  
      const isDuplicateISBN = await bookModel.findOne({ ISBN: ISBN });
      if (isDuplicateISBN) {
        return res
          .status(400)
          .send({ status: true, msg: "ISBN already exists." }); //ISBN is unique
      }
  
      if (!validator.isValid(category)) {
        return res
          .status(400)
          .send({ status: false, msg: "Please provide the Category" }); //Category must be present
      }
  
      if (!validator.isValid(subcategory)) {
        return res
          .status(400)
          .send({ status: false, msg: "Please provide the subCategory" }); //subcategory must be present
      }
  
      if (!validator.isValid(releasedAt)) {
        return res.status(400).send({
          status: false,
          msg: "Please provide the release date of book.",
        }); //release date is mandory
      }
  
      if (!/^\d{4}-\d{2}-\d{2}$/.test(releasedAt)) {
        //regex for checking the correct format of release date
        return res.status(400).send({
          status: false,
          msg: `${releasedAt} is an invalid date, formate should be like this YYYY-MM-DD`,
        });
      }
  
      const saved = await bookModel.create(book); //creating the Book details
      res.status(201).send({
        status: true,
        msg: "Book created and saved successfully.",
        data: saved,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({ msg: err.message });  /// status 500 for internal server error
    }
  };

 

let getBooks = async function (req, res) {
    try {
        let query = req.query;
        let filter = {
            isDeleted: false,
        };
        if (!validator.isValidReqBody(query)) {
          return res.status(400).send({ status:true, message: " Invalid parameters, please provide valid data"})
        }
        if (query.subcategory) {
                query.subcategory = { $in: query.subcategory.split(",") };
            }
       filter['$or'] = [
                { userId: query.userId },
                { category: query.category },
                { subcategory: query.subcategory }
            ];
        
        let filterByquery = await bookModel.find(filter).select({book_id:1, excerpt:1, userId:1, category:1, releasedAt:1, reviews:1})
        if (filterByquery.length == 0) {
            return res.status(404).send({ msg: "Book Not Found" });
        }
        const sortedBooks = filterByquery.sort((a, b) => a.title.localeCompare(b.title));
        res.status(200).send({ status: true, message: "Books list", data: sortedBooks });
        
    } catch (err) {
        return res.status(500).send({ statuS: false, message: err.message });
    }
};


let getBooksById = async (req, res) => {
  try {
      let data = req.params
      if(!validator.isValid(data)){
        res.ststus(400).send({ status:true, message: "userId is required in params"})
      }
      let id = data.userId
      if (id) {
          let findbook = await bookModel.findById(id).catch(err => null)
          if (!findbook) return res.status(404).send({ status: false, msg: `no book found by this BookID:${id}` })
          
          
        let bookid = findbook._id
        let reviews= await reviewModel.find({ _id: bookid, isDeleted: false })

        return res.status(200).send({ status: true, message: "Books list",  data: findbook, reviewsData:reviews })

        
      }
  }
  catch (err) {
      res.status(500).send({ status: false, data: err.message })
  }
}


module.exports={getBooks , createBook , getBooksById}