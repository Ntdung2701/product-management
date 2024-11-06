const Product = require("../../models/product.model");
const ProductCategory = require("../../models/product-category.model");
const filterStatusHelper = require("../../helpers/filterStatus");
const searchHelper = require("../../helpers/search");
const systemConfig = require("../../config/system");
const createTreeHelper = require("../../helpers/createTree");
const Account=require("../../models/account.model");
const paginationHelper = require("../../helpers/pagination");
//[Get]/admin/products
module.exports.index = async (req, res) => {
    const filterStatus = filterStatusHelper(req.query);

    let find = {
        deleted: false
    };
    if (req.query.status) {
        find.status = req.query.status;
    }
    const objectSearch = searchHelper(req.query);

    if (objectSearch.regex) {

        find.title = objectSearch.regex;
    }

    //phân trang
    const countProduct = await Product.countDocuments(find);
    let objectPagination = paginationHelper(
        {
            limitItem: 4,
            currentPage: 1
        },
        req.query,
        countProduct
    );
    //Sort
    let sort = {};
    if (req.query.sortKey && req.query.sortValue) {
        sort[req.query.sortKey] = req.query.sortValue;
    } else {
        sort.position = "desc";
    }

    //End sort
    const products = await Product.find(find)
        .sort(sort)
        .limit(objectPagination.limitItem)
        .skip(objectPagination.skip);
    for (const product of products) {
        //lấy ra thông tin người tạo
        const user= await Account.findOne({
            _id: product.createdBy.account_id
        });
        if(user){
            product.user.accountFullName=user.fullName;
        }
        // lấy ra thông tin người cập nhật gần nhất
        const updatedBy = product.updatedBy.slice(-1)[0];
        if(updatedBy){
            const userUpdated= await Account.findOne({
                _id: updatedBy.account_id
            });
            updatedBy.accountFullname=userUpdated.fullName;
        } 
    }
    res.render("admin/pages/products/index", {
        pageTitle: "Danh sản phẩm",
        products: products,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPagination
    });

};
//[PATH]/admin/products/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {

    const status = req.params.status;
    const id = req.params.id;
    const updatedBy= {
        account_id: res.locals.user.id,
        updatedAt: new Date()
    }

    await Product.updateOne({ _id: id }, { 
        status: status,
        $push:{updatedBy:updatedBy}
    });
    req.flash("success", "Cập nhật trạng thái sản phẩm thành công!");

    res.redirect("back");
};
//[PATH]/admin/products/change-multi
module.exports.changeMulti = async (req, res) => {
    const type = req.body.type;
    const ids = req.body.ids.split(", ");
    const updatedBy= {
        account_id: res.locals.user.id,
        updatedAt: new Date()
    }
    switch (type) {
        case "active":
            await Product.updateMany({ _id: { $in: ids } }, { 
                status: "active",
                $push:{updatedBy:updatedBy}
             });
            req.flash("success", `Cập nhật trạng thái hoạt động thành công ${ids.length} sản phẩm!`);
            break;
        case "inactive":
            await Product.updateMany({ _id: { $in: ids } }, { 
                status: "inactive",
                $push:{updatedBy:updatedBy}
             });
            req.flash("success", `Cập nhật trạng thái dừng hoạt động thành công ${ids.length} sản phẩm!`);
            break;
        case "delete-all":
            await Product.updateMany({ _id: { $in: ids } }, {
                deleted: true,
                deletedBy:{
                    account_id: res.locals.user.id,
                    deletedAt: new Date()
                }
            }
        );
            req.flash("success", `Đã xóa thành công ${ids.length} sản phẩm!`);
            break;
        case "change-position":
            for (const item of ids) {
                let [id, position] = item.split("-");
                position = parseInt(position);
                await Product.updateOne({ _id: id }, { 
                    position: position,
                    $push:{updatedBy:updatedBy}
                 });
                req.flash("success", `Đã đổi vị trí thành công sản phẩm!`);
            }

            break;
        default:
            break;
    }
    res.redirect("back");
};
//[DELETE]/admin/products/delete/:id
module.exports.deleteItem = async (req, res) => {


    const id = req.params.id;

    await Product.updateOne({ _id: id }, {
        deleted: true,
        deletedBy:{
            account_id: res.locals.user.id,
            deletedAt: new Date()
        }
    });
    req.flash("success", `Đã xóa thành công sản phẩm!`);
    res.redirect("back");
};
//[Get]/admin/products/create
module.exports.create = async (req, res) => {
    let find = {
        deleted: false
    };

    const category = await ProductCategory.find(find);
    const newCategory = createTreeHelper.tree(category);
    res.render("admin/pages/products/create", {
        pageTitle: "Thêm mới sản phẩm",
        category:newCategory
    });
};
//[Post]/admin/products/createPost
module.exports.createPost = async (req, res) => {

    req.body.price = parseInt(req.body.price);
    req.body.discountPercentage = parseInt(req.body.discountPercentage);
    req.body.stock = parseInt(req.body.stock);
    if (req.body.position == "") {
        const countProduct = await Product.countDocuments();
        req.body.position = countProduct + 1;
    } else {
        req.body.position = parseInt(req.body.position);
    }
    req.body.createdBy={
        account_id:res.locals.user.id
    };

    const product = new Product(req.body);
    await product.save();
    res.redirect(`${systemConfig.prefixAdmin}/products`);
};
//[Get]/admin/products/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        };
        const product = await Product.findOne(find);
        
    
        const category = await ProductCategory.find({
            deleted: false
        });
        const newCategory = createTreeHelper.tree(category);

        res.render("admin/pages/products/edit", {
            pageTitle: "Chỉnh sửa sản phẩm",
            product: product,
            category:newCategory
        });
    } catch (error) {

        res.redirect(`${systemConfig.prefixAdmin}/products`);
    }

};
//[PATCH]/admin/products/edit/:id
module.exports.editPatch = async (req, res) => {
    const id = req.params.id;
    req.body.price = parseInt(req.body.price);
    req.body.discountPercentage = parseInt(req.body.discountPercentage);
    req.body.stock = parseInt(req.body.stock);
    req.body.position = parseInt(req.body.position);
    if (req.file) {
        req.body.thumbnail = `/uploads/${req.file.filename}`;
    }
    try {
        const updatedBy= {
            account_id: res.locals.user.id,
            updatedAt: new Date()
        }
        await Product.updateOne({ _id: id }, {
            ...req.body,
            $push:{updatedBy:updatedBy}
        });
        req.flash("success", `Cập nhật thành công!`);
    } catch (error) {
        req.flash("error", `Cập nhật thất bại!`);
    }
    res.redirect("back");
};
//[Get]/admin/products/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        };
        const product = await Product.findOne(find);

        res.render("admin/pages/products/detail", {
            pageTitle: product.title,
            product: product
        });
    } catch (error) {

        res.redirect(`${systemConfig.prefixAdmin}/products`);
    }

};
