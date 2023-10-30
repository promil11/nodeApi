const mongoose = require("mongoose")

//create schema  
const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
    },
    last_name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
    },
    limit: {
        type: Number,
        default: 0,
    },
    accessible: {
        type: Boolean,
        default: true
    }
},
{timestamps: true}
)

//create model
const User = mongoose.model("user", userSchema)

module.exports = {User}