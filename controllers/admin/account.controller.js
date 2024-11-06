const Account = require("../../models/account.model");
const Role = require("../../models/role.model");
const systemConfig = require("../../config/system");
const filterStatusHelper = require("../../helpers/filterStatus");
const searchHelper = require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
var md5 = require('md5');
//[Get]/admin/accounts
module.exports.index = async (req, res) => {
    const filterStatus = filterStatusHelper(req.query);
    let find = {
        deleted: false,
    };
    if (req.query.status) {
        find.status = req.query.status;
    }
    const objectSearch = searchHelper(req.query);

    if (objectSearch.regex) {

        find.title = objectSearch.regex;
    }
    //phân trang
    const countProduct = await Account.countDocuments(find);
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
    const records = await Account.find(find)
        .select("-password -token")
        .sort(sort)
        .limit(objectPagination.limitItem)
        .skip(objectPagination.skip);;
    for (const record of records) {
        const role = await Role.findOne({
            _id: record.role_id,
            deleted: false
        });
        record.role = role;
    }
    res.render("admin/pages/accounts/index", {
        pageTitle: "Danh sách tài khoản",
        records: records,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPagination
    });
};
//[Get]/admin/accounts/create
module.exports.create = async (req, res) => {
    const roles = await Role.find({
        deleted: false
    });
    res.render("admin/pages/accounts/create", {
        pageTitle: "Tạo mới tài khoản",
        roles: roles
    });
};
//[Post]/admin/accounts/createPost
module.exports.createPost = async (req, res) => {
    const emailExist = await Account.findOne({
        email: req.body.email,
        deleted: false
    });
    if (emailExist) {
        req.flash("error", `Email ${req.body.email} đã tồn tại!`);
        res.redirect("back");
    }
    else {
        req.body.password = md5(req.body.password);
        const record = new Account(req.body);
        await record.save();
        res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    }

};
// [GET] /admin/accounts/edit/:id
module.exports.edit = async (req, res) => {
    let find = {
        _id: req.params.id,
        deleted: false,
    };

    try {
        const data = await Account.findOne(find);
        const roles = await Role.find({
            deleted: false,
        });
        res.render("admin/pages/accounts/edit", {
            pageTitle: "Chỉnh sửa tài khoản",
            data: data,
            roles: roles,
        });
    } catch (error) {
        res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    };
};
//[PATCH]/admin/accounts/edit/:id
module.exports.editPatch = async (req, res) => {
    const id = req.params.id;

    const emailExist = await Account.findOne({
        _id: { $ne: id },
        email: req.body.email,
        deleted: false
    });

    if (emailExist) {
        req.flash("error", `Email ${req.body.email} đã tồn tại`);
    } else {
        if (req.body.password) {
            req.body.password = md5(req.body.password);
        } else {
            delete req.body.password;
        }
        await Account.updateOne({ _id: id }, req.body);
        req.flash("success", "Cập nhật tài khoản thành công!");

    }
    res.redirect("back");
};
//[Get]/admin/account/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        };
        const account = await Account.findOne(find);
        const roles = await Role.findOne({
            deleted: false,
            _id: account.role_id
        });

        res.render("admin/pages/accounts/detail", {
            accountFullname: account.fullName,
            account: account,
            rolesName: roles.title
        });
    } catch (error) {

        res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    }

};
//[DELETE]/admin/accounts/delete/:id
module.exports.delete = async (req, res) => {
    const id = req.params.id;
    await Account.updateOne({ _id: id }, {
        deleted: true,
        deletedAt: new Date()
    });
    req.flash("success", `Đã xóa thành công tài khoản!`);
    res.redirect("back");
};
// [PATCH] /admin/accounts/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {

    const status = req.params.status;
    const id = req.params.id;
    const updatedBy = {
        account_id: res.locals.user.id,
        updatedAt: new Date()
    }

    await Account.updateOne({ _id: id }, {
        status: status,
        $push: { updatedBy: updatedBy }
    });
    req.flash("success", "Cập nhật trạng thái tài khoản thành công!");

    res.redirect("back");
};
//[PATH]/admin/accounts/change-multi
module.exports.changeMulti = async (req, res) => {
    const { type, ids } = req.body;
    const idList = ids.split(", "); // Chuyển chuỗi ID thành mảng

    const updatedAt = new Date();

    try {
        switch (type) {
            case "active":
                await Account.updateMany(
                    { _id: { $in: idList }, deleted: false },
                    {
                        status: "active",
                        updatedAt: updatedAt
                    }
                );
                req.flash("success", `Kích hoạt thành công ${idList.length} tài khoản!`);
                break;

            case "inactive":
                await Account.updateMany(
                    { _id: { $in: idList }, deleted: false },
                    {
                        status: "inactive",
                        updatedAt: updatedAt
                    }
                );
                req.flash("success", `Đã dừng hoạt động ${idList.length} tài khoản!`);
                break;

            case "delete-all":
                await Account.updateMany(
                    { _id: { $in: idList }, deleted: false },
                    {
                        deleted: true,
                        deletedAt: updatedAt,
                        updatedAt: updatedAt
                    }
                );
                req.flash("success", `Xóa thành công ${idList.length} tài khoản!`);
                break;

            case "change-position":
                for (const item of idList) {
                    let [id, position] = item.split("-");
                    position = parseInt(position);
                    await Account.updateOne(
                        { _id: id, deleted: false },
                        {
                            position: position,
                            updatedAt: updatedAt
                        }
                    );
                }
                req.flash("success", `Đã đổi vị trí thành công cho các tài khoản!`);
                break;

            default:
                req.flash("error", "Loại thao tác không hợp lệ.");
                break;
        }
        res.redirect("back");
    } catch (error) {
        console.error(error);
        req.flash("error", "Có lỗi xảy ra, vui lòng thử lại.");
        res.redirect("back");
    }
};
