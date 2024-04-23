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
user_route.get("/", userAuth.isLogin,userAuth.isUserBlock,usercontroller.home);
user_route.get("/login",userAuth.isLogout, usercontroller.loadLogin);
user_route.get("/registration",userAuth.isLogout, usercontroller.loadRegister);
// user first otp
user_route.post("/registration",userAuth.isLogout, usercontroller.insertUser);
user_route.post("/otp", usercontroller.otpLogin,userAuth.isUserBlock);
user_route.post("/resendotp", usercontroller.resendOtp);
// user with login
user_route.post("/userhome", usercontroller.userLogin);
user_route.get("/userprofile",userAuth.isLogin,userAuth.isUserBlock, usercontroller.loadUserProfile);

user_route.get("/userhome",userAuth.isLogin,userAuth.isUserBlock, usercontroller.backToUserHome);  

// loading shop page
user_route.get("/shoppage",userAuth.isLogin, userAuth.isUserBlock,usercontroller.loadShopPage);
// loading About page
user_route.get("/aboutpage",userAuth.isLogin,userAuth.isUserBlock, usercontroller.loadAboutPage);
// loading contact page
user_route.get("/contactpage",userAuth.isLogin,userAuth.isUserBlock, usercontroller.loadContactPage);
// loading Product Tab
user_route.get("/producttab/:id",userAuth.isLogin,userAuth.isUserBlock, usercontroller.loadProductTab);
// loading googleAuth

user_route.get('/logout',usercontroller.logout)

user_route.get("/google",passport.authenticate("google", { scope: ["profile", "email"] }));

user_route.get("/google/callback",passport.authenticate("google", { failureRedirect: "/failed" }),usercontroller.loadGoogleAuth);


// --------------------------------- wee2 project-------------------------

user_route.get('/viewcart',userAuth.isLogin,userAuth.isUserBlock,usercontroller.loadViewCart)
user_route.get('/edituserdetiles',userAuth.isLogin,userAuth.isUserBlock,usercontroller.editUseprofile)
user_route.post('/edituserdetiles/:id',userAuth.isLogin,userAuth.isUserBlock,usercontroller.updateUserProfile)


user_route.post('/userprofile/:id',userAuth.isLogin,userAuth.isUserBlock,usercontroller.updateUserPassword)

user_route.get('/adduseraddress/:id',userAuth.isLogin,userAuth.isUserBlock,usercontroller.loadAddressPage)
user_route.post('/adduseraddress',userAuth.isLogin,userAuth.isUserBlock,usercontroller.addUserAddress)
user_route.get('/edituseraddress/:id',userAuth.isLogin,userAuth.isUserBlock,usercontroller.loadEditUser)
user_route.post('/edituseraddress/:id',userAuth.isLogin,userAuth.isUserBlock,usercontroller.updateUserAddress)
user_route.delete('/deleteaddress/:id',userAuth.isLogin,userAuth.isUserBlock,usercontroller.deleteUseraddress)

user_route.post('/producttab/:id',userAuth.isLogin,userAuth.isUserBlock,usercontroller.addProductInCart)

user_route.post('/viewcart',userAuth.isLogin,userAuth.isUserBlock,usercontroller.quantityControll)

user_route.delete('/viewcart/:id',userAuth.isLogin,userAuth.isUserBlock,usercontroller.deleteCartProduct)

user_route.get('/checkoutpage',userAuth.isLogin,userAuth.isUserBlock,usercontroller.loadtCheckoutPage)

user_route.post('/checkoutpage/:id',userAuth.isLogin,userAuth.isUserBlock,usercontroller.editUseraddressInCheckout)

user_route.post('/checkoutpage',userAuth.isLogin,userAuth.isUserBlock,usercontroller.updatecartAddress)

user_route.post('/checkoutpageone',userAuth.isLogin,userAuth.isUserBlock,usercontroller.addCheckoutAddress)


user_route.post('/orderpage',userAuth.isLogin,userAuth.isUserBlock,usercontroller.placeOrder)

user_route.get('/orders/:id',userAuth.isLogin,userAuth.isUserBlock,usercontroller.loadOrderPage)

user_route.post('/ordersone',userAuth.isLogin,userAuth.isUserBlock,usercontroller.orderCancel)

user_route.get("/productspopular",userAuth.isLogin,userAuth.isUserBlock, usercontroller.sortByPopularity);
user_route.get("/productslowtohigh",userAuth.isLogin,userAuth.isUserBlock, usercontroller.sortByPriceLowToHigh);
user_route.get("/productshightolow",userAuth.isLogin,userAuth.isUserBlock, usercontroller.sortByPriceHighToLow);
user_route.get("/productsatoz",userAuth.isLogin,userAuth.isUserBlock, usercontroller.sortByAtoZ);
user_route.get("/productsztoa",userAuth.isLogin,userAuth.isUserBlock, usercontroller.sortByZtoA);



user_route.get("/user/wishlist",userAuth.isLogin,userAuth.isUserBlock,usercontroller.loadWishliist)
user_route.post("/user/wishlist",userAuth.isLogin,userAuth.isUserBlock,usercontroller.addProductInWishlist)
user_route.post("/user/wishlistone",userAuth.isLogin,userAuth.isUserBlock,usercontroller.removeWishlistProduct)
user_route.post("/verifyorder",userAuth.isLogin,userAuth.isUserBlock,usercontroller.verifyOrder)

user_route.post("/verifycoupon",userAuth.isLogin,userAuth.isUserBlock,usercontroller.verifyCoupon)

user_route.post("/user/productreturn",userAuth.isLogin,userAuth.isUserBlock,usercontroller.userReturnProduct)


user_route.post("/user/search",userAuth.isLogin,userAuth.isUserBlock,usercontroller.userSearch)

user_route.post("/user/sendcategoryname",userAuth.isLogin,userAuth.isUserBlock,usercontroller.searchCategoryName)

user_route.post("/user/removecoupon",userAuth.isLogin,userAuth.isUserBlock,usercontroller.removeCoupon)

user_route.get("/checkout-validation",userAuth.isLogin,userAuth.isUserBlock,usercontroller.proceedToCheckout )

user_route.get("/headercarrcount",userAuth.isLogin,userAuth.isUserBlock,usercontroller.headerCount )







module.exports = user_route;
