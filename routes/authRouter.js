const express = require("express");
const router = express.Router();
const multer= require("multer");
const path = require ('path')
const {
  register,
  signin,
logout,
forgotPassword,
ResetPassword
} = require("../controller/authController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profilepic/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });




router.post("/register", register);

router.post("/login", signin);

router.get("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", ResetPassword);

module.exports = router;
