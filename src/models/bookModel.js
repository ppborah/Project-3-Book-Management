const mongoose = require('mongoose')


const bookSchema = new mongoose.Schema({






}, { timestamps: true })

module.exports = mongoose.model('Book', bookSchema)