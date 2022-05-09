const mongoose = require('mongoose')


const reviewSchema = new mongoose.Schema({






}, { timestamps: true })

module.exports = mongoose.model('Review', reviewSchema)