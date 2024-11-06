const homeRouter = require("./home.router");
const categoryMidleware = require("../../middlewares/client/category.midleware");
const cartMidleware = require("../../middlewares/client/cart.middleware");
const productRouter = require("./product.route");
const searchRouter=require("./search.router");
const cartRouter=require("./cart.router");
const checkoutRouter=require("./checkout.router");
const userRouter=require("./user.router");
const usersRouter=require("./users.router.js");
const chatRouter=require("./chat.router");
const roomChatRouter=require("./rooms-chat.router.js");
const userMiddleware=require("../../middlewares/client/user.middleware");
const settingMiddleware=require("../../middlewares/client/setting.middleware");
const authMiddleware = require("../../middlewares/client/auth.middleware.js");

module.exports = (app) => {
    app.use(categoryMidleware.category);
    app.use(cartMidleware.cartId);
    app.use(userMiddleware.infoUser);
    app.use(settingMiddleware.settingGeneral);


    app.use("/", homeRouter);

    app.use("/products", productRouter);
    app.use("/search", searchRouter);
    app.use("/cart", cartRouter);
    app.use("/checkout", checkoutRouter);
    app.use("/user", userRouter);
    app.use("/users", authMiddleware.requireAuth,usersRouter);
    app.use("/rooms-chat", authMiddleware.requireAuth,roomChatRouter);

    app.use("/chat", authMiddleware.requireAuth, chatRouter);
};
