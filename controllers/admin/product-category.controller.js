const ProductCategory = require("../../models/product-category.model");
const systemConfig = require("../../config/system");
const filterStatusHelper = require("../../helpers/filterStatus");
const searchHelper = require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
const createTreeHelper = require("../../helpers/createTree");
const Account=require("../../models/account.model");
//[Get]/admin/products-category
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
    const countProduct = await ProductCategory.countDocuments(find);
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

    const records = await ProductCategory.find(find)
        .sort(sort)
        .limit(objectPagination.limitItem)
        .skip(objectPagination.skip);
    for (const product of records) {
        //lấy ra thông tin người tạo
        const user = await Account.findOne({
            _id: product.createdBy.account_id
        });
        if (user) {
            product.user.accountFullName = user.fullName;
        }
        // lấy ra thông tin người cập nhật gần nhất
        const updatedBy = product.updatedBy.slice(-1)[0];
        if (updatedBy) {
            const userUpdated = await Account.findOne({
                _id: updatedBy.account_id
            });
            updatedBy.accountFullname = userUpdated.fullName;
        }
    }
    const newRecords = createTreeHelper.tree(records);
    res.render("admin/pages/products-category/index", {
        pageTitle: "Danh mục sản phẩm",
        records: newRecords,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPagination
    });

};
//[Get]/admin/products-category/create
module.exports.create = async (req, res) => {
    let find = {
        deleted: false
    };

    const records = await ProductCategory.find(find);
    const newRecords = createTreeHelper.tree(records);

    res.render("admin/pages/products-category/create", {
        pageTitle: " Tạo danh mục sản phẩm",
        records: newRecords
    });

};

//[Post]/admin/products-category/createPost
module.exports.createPost = async (req, res) => {
    // const permission=res.locals.user.permissions;
    // if(permission.includes("products-category_create")){

    // }else{
    //     res.send("403");
    //     return;
    // }
    if (req.body.position == "") {
        const count = await ProductCategory.countDocuments();
        req.body.position = count + 1;
    } else {
        req.body.position = parseInt(req.body.position);
    }
    const record = new ProductCategory(req.body);
    await record.save();
    res.redirect(`${systemConfig.prefixAdmin}/products-category`);
};
//[Get]/admin/products-category/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {

    const status = req.params.status;
    const id = req.params.id;

    await ProductCategory.updateOne({ _id: id }, { status: status });
    req.flash("success", "Cập nhật trạng thái sản phẩm thành công!");

    res.redirect("back");
};
//[DELETE]/admin/products-category/delete/:id
module.exports.deleteItem = async (req, res) => {
    const id = req.params.id;
    await ProductCategory.updateOne({ _id: id }, {
        deleted: true,
        deletedAt: new Date()
    });
    req.flash("success", `Đã xóa thành công sản phẩm!`);
    res.redirect("back");
};
//[Get]/admin/products-category/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await ProductCategory.findOne({
            _id: id,
            deleted: false
        });
        const records = await ProductCategory.find({
            deleted: false
        });
        const newRecords = createTreeHelper.tree(records);
        res.render("admin/pages/products-category/edit", {
            pageTitle: "Chỉnh sửa danh mục sản phẩm",
            data: data,
            records: newRecords
        });
    } catch (error) {
        res.redirect(`${systemConfig.prefixAdmin}/products-category`);
    }
};
//[PATCH]/admin/products-category/edit/:id
module.exports.editPatch = async (req, res) => {
    const id = req.params.id;
    req.body.position = parseInt(req.body.position);
    if (req.file) {
        req.body.thumbnail = `/uploads/${req.file.filename}`;
    }
    try {
        await ProductCategory.updateOne({ _id: id }, req.body);
        req.flash("success", `Cập nhật thành công!`);
    } catch (error) {
        req.flash("error", `Cập nhật thất bại!`);
    }
    res.redirect("back");
};

//[Get]/admin/products-category/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        };
        const records = await ProductCategory.findOne(find);

        res.render("admin/pages/products-category/detail", {
            pageTitle: records.title,
            records: records
        });
    } catch (error) {

        res.redirect(`${systemConfig.prefixAdmin}/products-category`);
    }

};
//[PATH]/admin/products-category/change-multi
module.exports.changeMulti = async (req, res) => {
    const type = req.body.type;
    const ids = req.body.ids.split(", ");
    switch (type) {
        case "active":
            await ProductCategory.updateMany({ _id: { $in: ids } }, { status: "active" });
            req.flash("success", `Cập nhật trạng thái hoạt động thành công ${ids.length} sản phẩm!`);
            break;
        case "inactive":
            await ProductCategory.updateMany({ _id: { $in: ids } }, { status: "inactive" });
            req.flash("success", `Cập nhật trạng thái dừng hoạt động thành công ${ids.length} sản phẩm!`);
            break;
        case "delete-all":
            await ProductCategory.updateMany({ _id: { $in: ids } }, {
                deleted: true,
                deletedAt: new Date()
            });
            req.flash("success", `Đã xóa thành công ${ids.length} sản phẩm!`);
            break;
        case "change-position":
            for (const item of ids) {
                let [id, position] = item.split("-");
                position = parseInt(position);
                await ProductCategory.updateOne({ _id: id }, { position: position });
                req.flash("success", `Đã đổi vị trí thành công sản phẩm!`);
            }

            break;
        default:
            break;
    }
    res.redirect("back");
};