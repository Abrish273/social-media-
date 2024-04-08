const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: [50, "Name can not be more than 50 characters"],
    },

    description: {
      type: [String],
    
    },
    images: {
      type: [String],
      default: [],
   
  },

    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);



ProductSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "product",
  justOne: false,
});

ProductSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "product",
  justOne: false,
});
ProductSchema.pre("remove", async function (next) {
  await this.model("Review").deleteMany({ product: this._id });
});

module.exports = mongoose.model("Product", ProductSchema);


