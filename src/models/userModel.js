const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    enum: ["Mr", "Mrs", "Miss"],
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
    length: 10,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
    maxLength: 15,
  },
  address: {
    street: String,
    city: String,
    pincode: {
      type: String,
      length: 6,
    }
  }
}, { timestamps: true })


module.exports = mongoose.model("User", userSchema);
