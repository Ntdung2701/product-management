const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");
const productHelper = require("../../helpers/products");
const Order = require("../../models/order.model");

//[GET] /checkout/
module.exports.index = async (req, res) => {
    const cartId = req.cookies.cartId;
    const cart = await Cart.findOne({
        _id: cartId
    });
    if (cart.products.length > 0) {
        for (const item of cart.products) {
            const productId = item.product_id;
            const productInfo = await Product.findOne({
                _id: productId,
            }).select("title thumbnail slug price discountPercentage");
            productInfo.priceNew = productHelper.priceNewProducts(productInfo);
            item.productInfo = productInfo;
            item.totalPrice = productInfo.priceNew * item.quantity;
        }
    }
    cart.totalPrice = cart.products.reduce((sum, item) => sum + item.totalPrice, 0);
    res.render("client/pages/checkout/index", {
        pageTitle: "Đặt hàng",
        cartDetail: cart
    });
};
//[POST] /checkout/order
module.exports.order = async (req, res) => {
    const cartId = req.cookies.cartId;
    const userInfor = req.body;
    const cart = await Cart.findOne({
        _id: cartId
    });
    const products = [];
    for (const product of cart.products) {
        const objectProduct = {
            product_id: product.product_id,
            price: 0,
            discountPercentage: 0,
            quantity: product.quantity
        };
        const productInfor = await Product.findOne({
            _id: product.product_id
        }).select("price discountPercentage");
        objectProduct.price = productInfor.price;
        objectProduct.discountPercentage = productInfor.discountPercentage;
        products.push(objectProduct);

    }
    const orderInfor = {
        cart_id: cartId,
        userInfo: userInfor,
        products: products
    };
    const order = new Order(orderInfor);
    order.save();
    await Cart.updateOne({
        _id: cartId
    }, {
        products: []
    });
    res.redirect(`/checkout/success/${order.id}`);
};
//[GET] /checkout/success
module.exports.success = async (req, res) => {
    const order = await Order.findOne({
        _id: req.params.orderId
    });
    for (const product of order.products) {
        const productInfor = await Product.findOne({
            _id: product.product_id
        }).select("title thumbnail");
        product.productInfor = productInfor;
        product.priceNew = productHelper.priceNewProducts(product);
        product.totalPrice = product.priceNew * product.quantity;
    }
    order.totalPrice=order.products.reduce((sum, item)=>sum + item.totalPrice,0);
    res.render("client/pages/checkout/success", {
        pageTitle: "Đặt hàng thành công!",
        order:order
    });
};