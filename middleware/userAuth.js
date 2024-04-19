
const User = require("../models/userModel");
const Products = require("../models/productModel");
const Cart = require("../models/cartModel");

const isLogin = async (req, res, next) => {
    try {
        
         if (req.session.user) {
            res.locals.customer=true
            
            
           next()
        }
        else {         
               res.locals.customer=false

               const ProductData = await Products.find().populate('offerId')
               res.render("user/index", { ProductData });
        }

    } catch (erorr) {
        console.log(erorr.message)
    }
}

const isLogout = async (req, res, next) => {
    try {
         if (!req.session.user) {
            
             next()
        } else {
            res.redirect('/')
        }

    } catch (erorr) {
        console.log(erorr.message)
    }
}








const isUserBlock = async (req,res,next) => {

   try {
    const checkUser = await User.findById(req.session.user);
       
    if(checkUser.is_blocked === true){
        req.session.user = null;
        res.redirect('/login');
    }else{
        next();
    }
    
   } catch (error) {
    consoel.log(error.message)
   }

};







module.exports = {
    isLogin,
    isLogout,
    isUserBlock
}