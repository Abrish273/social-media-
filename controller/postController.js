const Product = require("../model/post");
const Like = require("../model/like");
const Comment = require("../model/comment");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const path = require("path");
const baseURL = process.env.BASE_URL;

const createposts = async (req, res) => {
  const userId=req.user.userId;
  console.log(userId);
  try {
    const { name, description  } = req.body;

    // Construct image paths with base URL
    const pictures = req.files.map(file => baseURL + "/uploads/posts/" + file.filename);

    const newPost = await Product.create({
   name,
   description ,
   images: pictures,
      user:userId
    });

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    res.status(StatusCodes.CREATED).json({ post: newPost });
  } catch (error) {
    console.error('Error creating boat:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
};

const getAllposts = async (req, res) => {
  try {
    const products = await Product.find({})
      // .populate("reviews")
      .populate({ path: "likes", select: "user" })
      .populate({ path: "comments", select: "user comment" }); // Populate the comments field with user and comment only

    // Map through products and calculate the total likes and comments for each product
    const productsWithDetails = products.map((product) => {
      const likesDetails = product.likes.map((like) => ({
        _id: like._id,
        user: like.user,
        product: like.product,
      }));

      const commentsDetails = product.comments.map((comment) => ({
        _id: comment._id,
        user: comment.user,
        product: comment.product,
        comment: comment.comment,
      }));

      return {
        ...product.toObject(),
        likes: likesDetails,
        comments: commentsDetails,
      };
    });

    res
      .status(StatusCodes.OK)
      .json({ products: productsWithDetails, count: products.length });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

const getSinglepost = async (req, res) => {
  try {
    const { id: productId } = req.params;

    const product = await Product.findOne({ _id: productId })
      // .populate("reviews")
      .populate({ path: "likes", select: "user" })
      .populate({ path: "comments", select: "user comment" }); // Populate the comments field with user and comment only

    if (!product) {
      throw new CustomError.NotFoundError(`No product with id : ${productId}`);
    }

    // Include both detailed likes and comments information in the response
    const likesDetails = product.likes.map((like) => ({
      _id: like._id,
      user: like.user,
      product: like.product,
    }));

    const commentsDetails = product.comments.map((comment) => ({
      _id: comment._id,
      user: comment.user,
      product: comment.product,
      comment: comment.comment,
    }));

    const suggestedComments = commentsDetails;

    const response = {
      product: {
        ...product.toObject(),
        likes: likesDetails,
        comments: commentsDetails,
        suggestedComments,
      },
    };

    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};


const updatepostbyid = async (req, res) => {
  const { id: productId } = req.params;

  const product = await Product.findOneAndUpdate({ _id: productId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ product });
};
const deletepostbyid = async (req, res) => {
  const productId = req.params;
  console.log(productId);
  const result = await Product.deleteOne({ _id: productId.id });

  if (result.deletedCount === 0) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ msg: "Success! Posts are removed." });
};

const uploadImage = async (req, res) => {
  try {
    if (!req.files) {
      throw new CustomError.BadRequestError("No File Uploaded");
    }
    const productImage = req.files.image;

    if (!productImage.mimetype.startsWith("image")) {
      throw new CustomError.BadRequestError("Please Upload Image");
    }

    const maxSize = 1024 * 1024;

    if (productImage.size > maxSize) {
      throw new CustomError.BadRequestError(
        "Please upload an image smaller than 1MB"
      );
    }

    // Assuming you have a productId parameter in the request body
    const productId = req.body.productId;

    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      throw new CustomError.NotFoundError("Product not found");
    }

    // Move the image to the uploads directory
    const imagePath = path.join(
      __dirname,
      "../public/uploads/" + `${productImage.name}`
    );
    await productImage.mv(imagePath);

    // Update the product's image field
    product.image = `/uploads/${productImage.name}`;
    await product.save();

    res.status(StatusCodes.OK).json({ message: "Image uploaded successfully" });
  } catch (error) {
    console.error("Error uploading image:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

const likeProduct = async (req, res) => {
  try {
    const { productId, userId } = req.body;
    // const userId = req.user.userId;

    // Check if the user has already liked the product
    const existingLike = await Like.findOne({
      user: userId,
      product: productId,
    });

    if (existingLike) {
      // User has already liked the product, so unlike it
      await Like.deleteOne({
        user: userId,
        product: productId,
      });

      // Decrement the like count in the Product model
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { numOfLikes: -1 } },
        { new: true }
      );

      res
        .status(StatusCodes.OK)
        .json({ product, message: "Product unliked successfully" });
    } else {
      // User hasn't liked the product, so like it
      const like = new Like({ user: userId, product: productId });
      await like.save();

      // Increment the like count in the Product model
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { numOfLikes: 1 } },
        { new: true }
      );

      res
        .status(StatusCodes.OK)
        .json({ product, message: "Product liked successfully" });
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
  }
};
const createComment = async (req, res) => {
  try {
    req.body.user = req.user.userId;
    const comment = new Comment(req.body);
    await comment.save();

    // Add the comment to the product's comments
    const product = await Product.findByIdAndUpdate(
      req.body.product,
      { $push: { comments: comment._id } },
      { new: true }
    );

    res.status(StatusCodes.CREATED).json({ comment, product });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
  }
};

module.exports = {
  createposts,
  getAllposts,
  getSinglepost,
  updatepostbyid,
  deletepostbyid,
  uploadImage,
  likeProduct,
  createComment,
};

