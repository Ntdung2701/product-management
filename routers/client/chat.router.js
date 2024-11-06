const express = require("express");
const router=express.Router();
const controller= require("../../controllers/client/chat.controller.js")
const chatmiddleware = require("../../middlewares/client/chat.middleware.js");
router.get("/:roomChatId", chatmiddleware.isAccess, controller.index);

module.exports=router;