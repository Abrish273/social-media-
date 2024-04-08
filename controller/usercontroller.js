const User = require("../model/user");
const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");
const { createTokenUser, attachCookiesToResponse } = require("../utils");

require("dotenv").config();
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};
const deleteuser = async (req, res) => {
  try {
    const { id } = req.params;
    const finduser = await User.findByIdAndDelete({ _id: id });
    if (!finduser) {
      return res.status(400).json({ error: "no such user found" });
    }
    return res.status(200).json({ message: "deleted sucessfully" });
  } catch (error) {
    res.status(500).json({ error: "something went wrong" });
  }
};

// const updateUser = async (req, res) => {
//   const userId = req.params.id;
//   const { fullname, position, email, role, api_permission } = req.body;
//   console.log(req.boday);
//   console.log("Request Body:", req.body);
//   console.log("Email:", email);
//   console.log("Fullname:", fullname);

//   // Get the user by userId
//   const user = await User.findById(userId);

//   // Check if at least one property is provided in the request body
//   if (!(email || fullname || role || api_permission || position)) {
//     return res
//       .status(StatusCodes.BAD_REQUEST)
//       .json({ error: "Please provide at least one value to update" });
//   }

//   // Update user properties if provided in the request body
//   if (email) user.email = email;
//   if (fullname) user.fullname = fullname;
//   if (role) user.role = role;
//   if (api_permission) user.api_permission = api_permission;
//   if (position) user.position = position;

//   // Save the updated user
//   await user.save();

//   // Create a new tokenUser with the updated user information
//   const tokenUser = createTokenUser(user);

//   // Attach cookies to the response
//   attachCookiesToResponse({ res, user: tokenUser });

//   // Respond with the updated user information
//   return res.status(StatusCodes.OK).json({ user: tokenUser });
// };

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    let updatedUser = await User.findById(userId);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update name if available
    if (req.body.name) {
      updatedUser.name = req.body.name;
    }

    // Update email if available
    if (req.body.email) {
      updatedUser.email = req.body.email;
    }

    // Update password if available
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updatedUser.password = await bcrypt.hash(req.body.password, salt);
    }

    // Update role if available
    if (req.body.role) {
      updatedUser.role = req.body.role;
    }

    // Handle pictures update if available
    if (req.files && req.files.length > 0) {
      // Assuming pictures is an array of strings representing image URLs
      const newPictures = req.files.map(
        (file) => `${process.env.BASE_URL}/uploads/${file.filename}`
      );
      updatedUser.pictures = newPictures;
    }

    await updatedUser.save();

    res.status(200).json({
      message: "User updated successfully",
      user: { ...updatedUser._doc, password: undefined },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateUserPassword = async (req, res) => {
  const userId = req.params.id;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide both values");
  }
  const user = await User.findById(userId);

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  user.password = newPassword;

  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Success! Password Updated." });
};

// const updateUseremailandPassword = async (req, res) => {
//   const { email, oldPassword, newPassword } = req.body;

//   if (!email || !oldPassword || !newPassword) {
//     throw new CustomError.BadRequestError(
//       "Please provide email, oldPassword, and newPassword"
//     );
//   }

//   const user = await User.findOne({ email });

//   if (!user) {
//     throw new CustomError.NotFoundError("User not found");
//   }

//   const isPasswordCorrect = await user.comparePassword(oldPassword);
//   if (!isPasswordCorrect) {
//     throw new CustomError.UnauthenticatedError("Invalid Credentials");
//   }

//   user.password = newPassword;

//   await user.save();
//   res.status(StatusCodes.OK).json({ msg: "Success! Password Updated." });
// };

const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};
const deleteAllUsers = async (req, res) => {
  try {
    console.log("Before deleting all users");
    const result = await User.deleteMany({});
    console.log("After deleting all users", result);

    res.status(200).json({ message: "All users deleted successfully" });
  } catch (error) {
    console.error("Error deleting all users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// //addition to handle caals and videos
// exports.  startAudioCall = catchAsync(async (req, res, next) => {
//   const from = req.user._id;
//   const to = req.body.id;

//   const from_user = await User.findById(from);
//   const to_user = await User.findById(to);

//   // create a new call audioCall Doc and send required data to client
//   const new_audio_call = await AudioCall.create({
//     participants: [from, to],
//     from,
//     to,
//     status: "Ongoing",
//   });

//   res.status(200).json({
//     data: {
//       from: to_user,
//       roomID: new_audio_call._id,
//       streamID: to,
//       userID: from,
//       userName: from,
//     },
//   });
// });

// exports.startVideoCall = catchAsync(async (req, res, next) => {
//   const from = req.user._id;
//   const to = req.body.id;

//   const from_user = await User.findById(from);
//   const to_user = await User.findById(to);

//   // create a new call videoCall Doc and send required data to client
//   const new_video_call = await VideoCall.create({
//     participants: [from, to],
//     from,
//     to,
//     status: "Ongoing",
//   });

//   res.status(200).json({
//     data: {
//       from: to_user,
//       roomID: new_video_call._id,
//       streamID: to,
//       userID: from,
//       userName: from,
//     },
//   });
// });

// exports.getCallLogs = catchAsync(async (req, res, next) => {
//   const user_id = req.user._id;

//   const call_logs = [];

//   const audio_calls = await AudioCall.find({
//     participants: { $all: [user_id] },
//   }).populate("from to");

//   const video_calls = await VideoCall.find({
//     participants: { $all: [user_id] },
//   }).populate("from to");

//   console.log(audio_calls, video_calls);

//   for (let elm of audio_calls) {
//     const missed = elm.verdict !== "Accepted";
//     if (elm.from._id.toString() === user_id.toString()) {
//       const other_user = elm.to;

//       // outgoing
//       call_logs.push({
//         id: elm._id,
//         img: other_user.avatar,
//         name: other_user.firstName,
//         online: true,
//         incoming: false,
//         missed,
//       });
//     } else {
//       // incoming
//       const other_user = elm.from;

//       // outgoing
//       call_logs.push({
//         id: elm._id,
//         img: other_user.avatar,
//         name: other_user.firstName,
//         online: true,
//         incoming: false,
//         missed,
//       });
//     }
//   }

//   for (let element of video_calls) {
//     const missed = element.verdict !== "Accepted";
//     if (element.from._id.toString() === user_id.toString()) {
//       const other_user = element.to;

//       // outgoing
//       call_logs.push({
//         id: element._id,
//         img: other_user.avatar,
//         name: other_user.firstName,
//         online: true,
//         incoming: false,
//         missed,
//       });
//     } else {
//       // incoming
//       const other_user = element.from;

//       // outgoing
//       call_logs.push({
//         id: element._id,
//         img: other_user.avatar,
//         name: other_user.firstName,
//         online: true,
//         incoming: false,
//         missed,
//       });
//     }
//   }

//   res.status(200).json({
//     status: "success",
//     message: "Call Logs Found successfully!",
//     data: call_logs,
//   });
// });

module.exports = {
  getAllUsers,
  getUserById,
  deleteuser,
  updateUser,
  deleteAllUsers,
  updateUserPassword,
  showCurrentUser,
};
