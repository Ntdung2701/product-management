const Product = require("../../models/product.model");
const productHelper = require("../../helpers/products");
const ProductCategoy = require("../../models/product-category.model");
const productCategoryHelper = require("../../helpers/product-category");
//[Get] /products
module.exports.index = async (req, res) => {
    const products = await Product.find({
        status: "active"
    }).sort({ position: "desc" });
    const newProducts = productHelper.priceNewProduct(products);

    res.render("client/pages/products/index", {
        pageTitle: "Trang danh sách sản phẩm",
        products: newProducts
    });
};
//[Get] /products/:slugProduct
module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            slug: req.params.slugProduct,
            status: "active"
        };
        const product = await Product.findOne(find);

        if (product.product_category_id) {
            const category = await ProductCategoy.findOne({
                _id: product.product_category_id,
                status: "active",
                deleted: false
            });
            product.category = category;
        }
        product.priceNew =productHelper.priceNewProducts(product);

        res.render("client/pages/products/detail", {
            pageTitle: product.title,
            product: product
        });
    } catch (error) {

        res.redirect(`/products`);
    }
};
//[Get] /products/:slugCategory
module.exports.category = async (req, res) => {

    const category = await ProductCategoy.findOne({
        slug: req.params.slugCategory,
        status: "active",
        deleted: false
    });


    const listSubCategory = await productCategoryHelper.getSubCategory(category.id);
    const listSubCategoryId = listSubCategory.map(item => item.id);
    const products = await Product.find({
        product_category_id: { $in: [category.id, ...listSubCategoryId] },
        deleted: false
    }).sort({ position: "desc" });
    const newProducts = productHelper.priceNewProduct(products);

    res.render("client/pages/products/index", {
        pageTitle: category.title,
        products: newProducts
    });
};