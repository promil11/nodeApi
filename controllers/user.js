const { User } = require("../models/user.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Mailgen = require("mailgen");
const nodemailer = require("nodemailer");
// const {VsAuthenticator} = require("@vs-org/authenticator")
require("dotenv").config();

async function userRegister(req, res) {
  let bodyData = req.body;
  if (
    bodyData.first_name &&
    bodyData.last_name &&
    bodyData.email &&
    bodyData.password &&
    bodyData.gender
  ) {
    let hashedPassword = await bcrypt.hash(bodyData.password, 10);
    await User.create({
      first_name: bodyData.first_name,
      last_name: bodyData.last_name,
      email: bodyData.email,
      password: hashedPassword,
      gender: bodyData.gender,
      accessible: true,
    });
    res.status(201).send("User Data Registered Successfully");
  } else {
    return res.send("need to filled full details");
  }
}

function generateJwtToken(req, res) {
  let bodyData = req.body;
  let user = {
    email: bodyData.email,
    password: bodyData.password,
  };
  let jwtAccessToken = jwt.sign(user, process.env.SECRET, {
    expiresIn: 300000,
  });
  return jwtAccessToken;
}

function generateRefreshToken(req, res) {
  let bodyData = req.body;
  let user = {
    email: bodyData.email,
    password: bodyData.password,
  };
  let refreshToken = jwt.sign({ user }, process.env.SECRETREFRESHKEY, {
    expiresIn: "30d",
  });
  return refreshToken;
}

async function userLogin(req, res) {
  let bodyData = req.body;
  let data = await User.findOne({ email: bodyData.email });
  if (data.email && !data.password)
    return res.status(404).send("credentials are incomplete");
  if (data == null)
    return res.status(404).send("user are not exist/registered");
  if (data.accessible == false)
    return res.status(401).send("user are not able to login more than 3 times");
  if (await bcrypt.compare(bodyData.password, data.password)) {
    // console.log("password matched")
    data.limit = 0;
    data.save();
    let refreshToken = generateRefreshToken(req, res);
    let jwtAccessToken = generateJwtToken(req, res);
    // console.log(refreshToken)
    // return res.status(200).json({"message":"user loggedIn successfully", "jwt-token": jwtAccessToken, "refresh-token": refreshToken})
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "strict",
      })
      .header("Authorization", jwtAccessToken)
      .status(200)
      .json({
        status: 1,
        message: "user loggedIn successfully",
        "jwt-token": jwtAccessToken,
        "refresh-token": refreshToken,
      });
  } else {
    // console.log("password not matched")
    console.log(data.limit);
    if (data.limit >= 3) {
      data.accessible = false;
    }
    data.limit = data.limit + 1;
    data.save();
    res.status(401).send("user unauthorization! credential incorrect");
  }
}

async function adminGiveAccess(req, res) {
  let bodyData = req.body;
  let userExist = await User.findOne({ email: bodyData.email });
  if (userExist == null) return res.status(404).send("user are not registered");
  userExist.accessible = true;
  userExist.limit = 0;
  userExist.save();
  res.send("admin give authority to login");
}

// async function userForgotPassword(req, res) {
//     let bodyData = req.body
//     let userExist = await User.findOne({email: bodyData.email})
//     if(userExist == null)return res.status(404).send("user are not registered")

//     const transporter = nodemailer.createTransport({
//         host: "smtp.gmail.com",
//         port: 587,
//         secure: false,
//         auth: {
//           user:process.env.EMAIL,
//           pass:process.env.PASSWORD,
//         }
//       });

//       let totp = await otpGenerator()

//       let mailOptions = {
//         from:{
//             name:"forgot password (one-time-password)",
//             address: process.env.EMAIL,
//         },
//         to: ["19bit048@ietdavv.edu.in"],
//         subject: "OTP",
//         text:"this is OTP",
//         html:`<p>this is your OTP: ${totp}</p> click here:http://localhost:4001/otpcheck/otp`
//       }

//       transporter.sendMail(mailOptions).then(()=>{
//         return res.status(201).json({msg: "you should receive email"})
//       }).catch(error=>{
//         return res.status(500).json({error})
//       })

// }

// // handledisplayOtp
// async function handleOtp(req, res) {
//     res.render("otpView")
// }

// //handleCheckOtp
// async function handleCheckOtp(req, res) {
//     let bodyData = req.body
//     if(!bodyData.myOTP)return res.status(400).send("OTP Must Provided inside field")
//     if(VsAuthenticator.verifyTOTP(bodyData.myOTP, "MMXF24TZGNIEE5D2MFGXKMZMGBASC6RRGA7TW4J6OV4UWZLWERRA"))return res.render("passwordpage")
//     else return res.status(400).send("Invalid OTP")
// }

// //hanldeResetPassword
// async function handleResetPassword(req, res) {
//     let bodyData = req.body
//     console.log(bodyData)
// }

// async function otpGenerator() {
//     let secret = VsAuthenticator.generateSecret("userPromil", "promiljain11@gmail.com")
//     console.log(secret)
//     const totp = VsAuthenticator.generateTOTP("MMXF24TZGNIEE5D2MFGXKMZMGBASC6RRGA7TW4J6OV4UWZLWERRA")
//     return totp
// }

async function userPostForgotPassword(req, res) {
  let bodyData = req.body;
  let userExist = await User.findOne({ email: bodyData.email });
  if (userExist == null) return res.status(404).send("user are not registered");

  let secret = process.env.SECRET + userExist.password;
  let user = {
    email: bodyData.email,
    id: userExist._id,
  };

  let tokenGenerate = jwt.sign(user, secret, { expiresIn: "15m" });
  let linkGenerate = `http://localhost:4001/user/resetpassword/${userExist._id}/${tokenGenerate}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  let mailOptions = {
    from: {
      name: "one-time-password reset link",
      address: process.env.EMAIL,
    },
    to: ["19bit048@ietdavv.edu.in"],
    subject: "reset password",
    text: "",
    html: `<p>this is your one-time-reset link: ${linkGenerate}</p>`,
  };

  transporter
    .sendMail(mailOptions)
    .then(() => {
      return res.status(201).json({ msg: "you should receive email" });
    })
    .catch((error) => {
      return res.status(500).json({ error });
    });
}

async function userPostResetPassword(req, res) {
  let id = req.params.id;
  let token = req.params.token;
  let userExist = await User.findOne({ _id: id });
  if (userExist == null) return res.status(404).send("user are not registered");

  let secret = process.env.SECRET + userExist.password;
  try {
    let confirm = jwt.verify(token, secret);
    console.log(confirm.email);
    console.log("user token verified...");
    let bodyData = req.body;
    let userExist = await User.findOne({ email: confirm.email });
    let hashedPassword = await bcrypt.hash(bodyData.password, 10);
    userExist.password = hashedPassword;
    userExist.save();
    return res.status(201).send("user password updated successfully");
  } catch (err) {
    console.log(err.message);
    return res.send(err.message);
  }
}

async function userChangePassword(req, res) {
  let bodyData = req.body;
  let userExist = await User.findOne({ email: bodyData.email });
  if (userExist == null) return res.status(404).send("user are not registered");

  let hashedPassword = await bcrypt.hash(bodyData.password, 10);
  userExist.password = hashedPassword;
  userExist.save();
  res.status(200).send("password changed successfully");
}

module.exports = {
  userRegister,
  userLogin,
  adminGiveAccess,
  userChangePassword,
  userPostForgotPassword,
  userPostResetPassword,
  // handleOtp,
  // handleCheckOtp,
  // handleResetPassword
};

