const systemConfig = require("../../config/system");
const dashboardRouter = require("./dashboard.router");
const productRouter = require("./product.router");
const productCategoryRouter = require("./product-category.router");
const roleRouter = require("./role.router");
const accountRouter = require("./account.router");
const authRouter = require("./auth.router");
const middleware = require("../../middlewares/admin/auth.middleware");
const myAccountRouter = require("./my-account.router");
const settingRouter = require("./setting.router");
module.exports = (app) => {
    const PATH_ADMIN = systemConfig.prefixAdmin;
    app.use(
        PATH_ADMIN + "/dashboard",
        middleware.requireAuth
        , dashboardRouter);
    app.use(
        PATH_ADMIN + "/products",
        middleware.requireAuth
        , productRouter);
    app.use(
        PATH_ADMIN + "/products-category",
        middleware.requireAuth
        , productCategoryRouter);
    app.use(
        PATH_ADMIN + "/roles",
        middleware.requireAuth,
        roleRouter);
    app.use(PATH_ADMIN + "/accounts",
        middleware.requireAuth,
        accountRouter);
    app.use(PATH_ADMIN + "/auth", authRouter);
    app.use(
        PATH_ADMIN + "/my-account",
        middleware.requireAuth,
        myAccountRouter);
    app.use(
        PATH_ADMIN + "/settings",
        middleware.requireAuth,
        settingRouter);
}
