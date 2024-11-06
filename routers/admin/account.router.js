const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer();
const controller = require("../../controllers/admin/account.controller");
const validate = require("../../validates/admin/account.validate");
const uploadCloud = require("../../middlewares/admin/uploadCloud.middleware");
router.get("/", controller.index);
router.get("/create", controller.create);
router.get("/edit/:id", controller.edit);
router.get("/detail/:id", controller.detail);
router.delete("/delete/:id", controller.delete);
router.patch("/change-status/:status/:id", controller.changeStatus);
router.patch("/change-multi", controller.changeMulti);
router.post(
    "/create",
    upload.single('avatar'),
    uploadCloud.upload,
    validate.createPost,
    controller.createPost
);
router.patch(
    "/edit/:id",
    upload.single('avatar'),
    uploadCloud.upload,
    validate.editPatch,
    controller.editPatch
);
module.exports = router;