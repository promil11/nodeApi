const express = require("express")
const router = express.Router()
const {adminGiveAccess} = require("../controllers/user.js")

//admin giveAccess api
router.post("/", adminGiveAccess)

module.exports = router