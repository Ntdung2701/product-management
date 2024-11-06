const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/user.controller.js")
const validate = require("../../validates/client/user.validate.js");
const authMiddleware = require("../../middlewares/client/auth.middleware.js");

router.get("/register", controller.register);
router.get("/login", controller.login);

router.post(
    "/register",
    validate.registerPost,
    controller.registerPost
);
router.post(
    "/login",
    validate.loginPost,
    controller.loginPost
);
router.get("/logout", controller.logout);
router.get("/info/edit/:id", controller.edit);
router.patch("/info/edit/:id", controller.editPatch);
router.get("/password/forgot", controller.forgotPassword);
router.post(
    "/password/forgot",
    validate.forgotPasswordPost,
    controller.forgotPasswordPost
);
router.post(
    "/password/otp",
    controller.otpPasswordPost
);
router.post(
    "/password/reset",
    validate.resetPasswordPost,
    controller.resetPasswordPost
);
router.get("/password/otp", controller.otpPassword);
router.get("/password/reset", controller.resetPassword);
router.get(
    "/info",
    authMiddleware.requireAuth,
    controller.info
);
module.exports = router;