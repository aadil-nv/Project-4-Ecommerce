const express = require("express");
const user_route = express();
const bodyParser = require("body-parser");
const usercontroller = require("../controllers/usercontroller");
const userAuth = require("../middleware/userAuth");
const { addCategory } = require("../controllers/admincontroller");
const passport = require("passport");
// const googleLogin=require('../middleware/passport')

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

// without user loginage
user_route.get("/", userAuth.isLogin,usercontroller.home);
user_route.get("/login",userAuth.isLogout, usercontroller.loadLogin);
user_route.get("/registration",userAuth.isLogout, usercontroller.loadRegister);
// user first otp
user_route.post("/registration",userAuth.isLogout, usercontroller.insertUser);
user_route.post("/otp", usercontroller.otpLogin);
user_route.post("/resendotp", usercontroller.resendOtp);
// user with login
user_route.post("/userhome", usercontroller.userLogin);
user_route.get("/userprofile",userAuth.isLogin, usercontroller.loadUserProfile);

user_route.get("/userhome",userAuth.isLogin, usercontroller.backToUserHome);  

// loading shop page
user_route.get("/shoppage",userAuth.isLogin, usercontroller.loadShopPage);
// loading About page
user_route.get("/aboutpage",userAuth.isLogin, usercontroller.loadAboutPage);
// loading contact page
user_route.get("/contactpage",userAuth.isLogin, usercontroller.loadContactPage);
// loading Product Tab
user_route.get("/producttab/:id",userAuth.isLogin, usercontroller.loadProductTab);
// loading googleAuth

user_route.get('/logout',usercontroller.logout)

user_route.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

user_route.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/failed" }),
  usercontroller.loadGoogleAuth
);


// --------------------------------- wee2 project-------------------------

user_route.get('/viewcart',userAuth.isLogin,usercontroller.loadViewCart)
user_route.get('/edituserdetiles',userAuth.isLogin,usercontroller.editUseprofile)
user_route.post('/edituserdetiles/:id',userAuth.isLogin,usercontroller.updateUserProfile)


user_route.post('/userprofile/:id',userAuth.isLogin,usercontroller.updateUserPassword)

user_route.get('/adduseraddress/:id',userAuth.isLogin,usercontroller.loadAddressPage)
user_route.post('/adduseraddress',userAuth.isLogin,usercontroller.addUserAddress)
user_route.get('/edituseraddress/:id',userAuth.isLogin,usercontroller.loadEditUser)
user_route.post('/edituseraddress/:id',userAuth.isLogin,usercontroller.updateUserAddress)
user_route.delete('/deleteaddress/:id',userAuth.isLogin,usercontroller.deleteUseraddress)

user_route.post('/producttab/:id',userAuth.isLogin,usercontroller.addProductInCart)

user_route.post('/viewcart',userAuth.isLogin,usercontroller.quantityControll)

user_route.delete('/viewcart/:id',userAuth.isLogin,usercontroller.deleteCartProduct)

user_route.get('/checkoutpage',userAuth.isLogin,usercontroller.loadtCheckoutPage)

user_route.post('/checkoutpage/:id',userAuth.isLogin,usercontroller.editUseraddressInCheckout)

user_route.post('/checkoutpage',userAuth.isLogin,usercontroller.updatecartAddress)

user_route.post('/checkoutpageone',userAuth.isLogin,usercontroller.addCheckoutAddress)


user_route.post('/orderpage',userAuth.isLogin,usercontroller.placeOrder)

user_route.get('/orders/:id',userAuth.isLogin,usercontroller.loadOrderPage)

user_route.post('/ordersone/:id',userAuth.isLogin,usercontroller.orderCancel)





module.exports = user_route;
