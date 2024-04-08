const express = require("express");
const { getMessages, sendMessage } = require("../controller/messageController.js");


const router = express.Router();

router.get("/:id",  getMessages);
router.post("/send/:id",  sendMessage);

module.exports= router;
