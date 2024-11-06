const Product=require("../../models/product.model");
const productHelper=require("../../helpers/products");
//[Get] /
module.exports.index = async (req, res) => {
    const productFeatured= await Product.find({
        deleted:false,
        featured:"1",
        status:"active"
    });
    const newProductsFeatured= productHelper.priceNewProduct(productFeatured);
    const productNew= await Product.find({
        deleted:false,
        status:"active"
    }).sort({position:"desc"});
    const newProductsNew= productHelper.priceNewProduct(productNew);
    res.render("client/pages/home/index", {
        pageTitle: "Trang chủ",
        productFeatured:newProductsFeatured,
        productNew:newProductsNew
    });
}
