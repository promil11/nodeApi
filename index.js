const express = require('express')
const app = express()
const path = require("path")
const userRouter = require("./routers/user.js")
const adminRouter = require("./routers/admin.js")
const viewRouter = require("./routers/viewpageRouter.js")
const {connectDB} = require("./connection.js")

//mongoDB connection->
connectDB().then(()  => console.log("database connected successfully")).catch((err)=> console.log(err))


//middlewares->
app.use(express.urlencoded({extended: false}))


app.use('/user', userRouter)
app.use('/admin', adminRouter)
// app.use('/otpcheck', viewRouter)

app.set("view engine", "ejs")
app.set("views", path.resolve("./views"))



app.listen(4001, ()=> console.log("server are running at port 4001"))
