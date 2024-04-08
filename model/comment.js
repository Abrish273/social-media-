
const mongoose = require("mongoose");
const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: mongoose.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  comment:{
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Comment", CommentSchema);