const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/furniture_ecommerce");

const { render } = require("ejs");
const flash = require('express-flash')
const path = require("path");
const express = require("express");
const user_route = require("./routes/userRoute");
const app = express();
const session = require("express-session");
const nocache = require("nocache");
require("dotenv").config();
require("./middleware/passport");
const passport = require("passport");

app.use(flash());
app.use(nocache());



app.use(
  session({
    secret: "yyy",
    resave: true,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(passport.initialize());
app.use(passport.session());

const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

const adminRoute = require("./routes/adminRoute");

app.use("/", adminRoute);

app.get("/adminlogin", (req, res) => {
  res.render("admin/adminlogin");
});
//?-----------------------------------------------------------------------------
app.get("*",(req,res)=>{
  res.render('user/error404')
})
//?-----------------------------------------------------------------------------


app.listen("7777", () => {
  console.log("server has started on http://localhost:7777");
});
