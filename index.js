const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://adilev2000:zlUXzVPoyvBdHnue@cluster0.nlcjdgg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
.then((data)=>{
  console.log('mongodb Connected',data.connection.host)
})

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
app.use(nocache());
const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

const adminRoute = require("./routes/adminRoute");

app.use("/", adminRoute);

app.get("/adminlogin", (req, res) => {
  if (req.session.admin) {
    return res.redirect('/admindashboard');
  } else {
    res.render("admin/adminlogin");
  }
});
//?-----------------------------------------------------------------------------
app.get("*", (req, res) => {
  res.render('user/error404')
})
//?-----------------------------------------------------------------------------


app.listen("7777", () => {
  console.log("server has started on http://localhost:7777");
});
