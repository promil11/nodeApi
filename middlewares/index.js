
const jwt = require("jsonwebtoken")
require('dotenv').config()

async function userLoginAuth(req, res, next) {
    try {
        const token = req.headers["jwttoken"]
        // console.log(req.headers)
        const verified = jwt.verify(token,process.env.SECRET)
        if(verified) {
            console.log("authentication successfull")
            next()
        }else {
            let refreshToken = req.headers["refresh-token"]
            if(!refreshToken) res.status(401).send("access denied! no refresh token are provided")
            try{
                let verified = jwt.verify(refreshToken, process.env.SECRETREFRESHKEY)
                // console.log(verified)
                let accessToken = jwt.sign({user: verified.user},process.env.SECRETREFRESHKEY, { expiresIn: 300000 })
                res.header('Authorization', accessToken)
                console.log("recreate access token from refresh Token")
                next()
            }catch(err){
                res.status(400).send("invalid refresh token")
            }
        }
    }catch(err) {
        res.status(400).send("invalid token")
    }
};

module.exports = {userLoginAuth}

//$2b$10$6WWvB0pSk./Jfr2sR/52cuFI8EXA80sA6oLLAv7y.Da7dAgFch03e