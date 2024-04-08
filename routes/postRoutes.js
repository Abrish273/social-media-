const express = require("express");
const router = express.Router();
const path = require ('path')
const multer = require("multer");
const {
    createposts,
    getAllposts,
    getSinglepost,
    updatepostbyid,
    deletepostbyid,
    uploadImage,
    likeProduct,
    createComment,
  } = require("../controller/postController");

const {
  authenticateUser,
  authorizePermissions,
} = require("../middelware/authentication");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/posts/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.route("/").post(
  // authenticateUser,
  upload.array('images', 6),
  createposts
  ).get(getAllposts);

router.route("/uploadImage").post([authenticateUser], uploadImage);

router
  .route("/:id")
  .get(getSinglepost)
  .patch(updatepostbyid)
  .delete(deletepostbyid);

router.post("/like", likeProduct);

router.post("/comments", authenticateUser, createComment);
// router.route("/:id/reviews").get(getSingleProductReviews);

module.exports = router;
