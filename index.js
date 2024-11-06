const express = require("express");
const path = require('path');
const flash = require('express-flash');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const methodOverride = require("method-override");
const database = require("./config/database");
const systemConfig = require("./config/system");
const moment = require("moment");
const http = require('http');
const multer = require("multer");
const {Server}= require("socket.io");



require("dotenv").config();
const route = require("./routers/client/index.route");
const routeAdmin = require("./routers/admin/index.router");

database.connect();
const app = express();
const port = process.env.PORT;

//Socket IO
const server = http.createServer(app);
const io= new Server(server);
global._io = io;

//END Socket IO
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: false }));

app.set("views", `${__dirname}/views`);
app.set("view engine", "pug");
//Flash
app.use(cookieParser("aygdvaem"));
app.use(session({ cookie: { maxAge: 60000 } }));
app.use(flash());

//End flash
//tinymce
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));
//End tinymce
//App local variables
app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.locals.moment = moment;

app.use(express.static(`${__dirname}/public`));
//Router
route(app);
routeAdmin(app);
app.get("*", (req, res) => {
    res.render("client/pages/errors/404", {
        pageTitle: "404 Not Found",
    });
});
server.listen(port, () => {
    console.log(`App listening on port ${port}`);
});