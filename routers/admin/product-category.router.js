const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer();
const controller = require("../../controllers/admin/product-category.controller");
const validate = require("../../validates/admin/product-category");
const uploadCloud=require("../../middlewares/admin/uploadCloud.middleware");
router.patch("/change-status/:status/:id", controller.changeStatus);
router.patch("/change-multi", controller.changeMulti);
router.delete("/delete/:id", controller.deleteItem);
router.get("/detail/:id", controller.detail);
router.get("/", controller.index);
router.get("/create", controller.create);
router.post(
    "/create",
    upload.single('thumbnail'),
    uploadCloud.upload,
    validate.createPost,
    controller.createPost
);
router.get("/edit/:id", controller.edit);
router.patch(
    "/edit/:id",
    upload.single('thumbnail'),
    uploadCloud.upload,
    validate.createPost,
    controller.editPatch
);


module.exports = router;