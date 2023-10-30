const mongoose = require("mongoose")

async function connectDB() {
   return mongoose.connect("mongodb+srv://promax11:promax11@cluster0.a9xb3z3.mongodb.net/")
}

module.exports = {connectDB}